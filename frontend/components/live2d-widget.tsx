"use client";

/**
 * Live2D 渲染器 v2 —— pixi-live2d-display (2026-09-07 二期)
 * 一期用 2018 年老库 live2d-widget(只能播放模型自带 idle, 无法按需触发动作)。
 * 二期换 pixi-live2d-display@0.4 + live2d.min.js(Cubism 2.1 core), 支持:
 *   - 按需触发真实动作 model.motion('', idx) (hijiki 的 01~08.mtn)
 *   - 空闲随机小动作(舔毛/伸腰等)
 *   - 点击命中测试(模型 json 需含 hit_areas)
 * 渲染管线运行时注入 public/live2d/vendor/(不进 Next bundle):
 *   live2d.min.js → pixi.min.js → cubism2.min.js (全局: Live2D / PIXI / PIXI.live2d)
 *
 * 并发/生命周期: pixi 实例是模块级共享单例(sharedPet)。
 * React StrictMode 的 dev 双挂载 / 配置切换 / 隐藏恢复 都走同一套幂等逻辑:
 *   挂载 → 已有同 key 实例则复用; 不同 key 则销毁重建; 卸载 → 延迟 120ms 销毁
 *   (strict 双挂载间隔为微秒级, 延迟销毁可被复用路径取消, 不闪不重建)。
 * 对外接口与一期一致: 自行创建 canvas(fixed 定位), onReady(canvas)。
 */
import { useEffect, useRef } from "react";

export interface Live2DRendererProps {
  /** 相对 /live2d/models/ 的模型路径, 如 "hijiki/hijiki.model.json" */
  modelPath: string;
  /** 桌面端画布宽度 px(高自动按 2:1) */
  width: number;
  /** 移动端缩放(触屏设备, 改 canvas CSS 尺寸) */
  mobileScale: number;
  position: "left" | "right";
  /** 距底部 px(正值向上抬) */
  bottomOffset: number;
  /** 当前是否为触屏设备 */
  isTouch: boolean;
  /** canvas 就绪回调(已设置 z-index/样式, 且挂好 __petMotion) */
  onReady: (canvas: HTMLElement) => void;
  onError?: () => void;
}

export const PET_CANVAS_Z = 2147483001;
export const PET_UI_Z = 2147483002;

const VENDOR_LOCAL = [
  "/live2d/vendor/live2d.min.js",
  "/live2d/vendor/pixi.min.js",
  "/live2d/vendor/cubism2.min.js",
];
const VENDOR_CDN = [
  "https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js",
  "https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js",
  "https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism2.min.js",
];

let vendorPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("script load failed: " + src));
    document.head.appendChild(s);
  });
}

function ensureVendor(): Promise<void> {
  if (vendorPromise) return vendorPromise;
  vendorPromise = (async () => {
    const w = window as any;
    if (typeof w.Live2D === "undefined") {
      try {
        await loadScript(VENDOR_LOCAL[0]);
      } catch {
        await loadScript(VENDOR_CDN[0]);
      }
    }
    if (typeof w.PIXI === "undefined") {
      try {
        await loadScript(VENDOR_LOCAL[1]);
      } catch {
        await loadScript(VENDOR_CDN[1]);
      }
    }
    if (!(w.PIXI && w.PIXI.live2d)) {
      try {
        await loadScript(VENDOR_LOCAL[2]);
      } catch {
        await loadScript(VENDOR_CDN[2]);
      }
    }
  })();
  return vendorPromise;
}

// ── 共享单例 ──

interface PetHandle {
  key: string;
  canvas: HTMLCanvasElement;
  app: any;
  idleTimer: ReturnType<typeof setInterval> | null;
}

let sharedPet: PetHandle | null = null;
let destroyTimer: ReturnType<typeof setTimeout> | null = null;

function destroyPet(p: PetHandle) {
  if (p.idleTimer) clearInterval(p.idleTimer);
  try {
    p.app?.destroy(true, { children: true });
  } catch {
    /* noop */
  }
  if (p.canvas.parentNode) p.canvas.remove();
}

function scheduleDestroy(ms = 120) {
  if (destroyTimer) clearTimeout(destroyTimer);
  destroyTimer = setTimeout(() => {
    destroyTimer = null;
    if (sharedPet) {
      destroyPet(sharedPet);
      sharedPet = null;
    }
  }, ms);
}

function cancelDestroy() {
  if (destroyTimer) {
    clearTimeout(destroyTimer);
    destroyTimer = null;
  }
}

interface CreateOpts {
  modelPath: string;
  cssW: number;
  cssH: number;
  mobileScale: number;
  position: "left" | "right";
  bottomOffset: number;
  isTouch: boolean;
}

function randMotionIdx(): number {
  return Math.floor(Math.random() * 8);
}

async function createPet(o: CreateOpts): Promise<PetHandle> {
  await ensureVendor();
  const w: any = window;
  const PIXI = w.PIXI;
  const Live2DModel = PIXI.live2d.Live2DModel;
  const MotionPriority = PIXI.live2d.MotionPriority;
  const logicalW = o.cssW * 2;
  const logicalH = o.cssH * 2;

  const canvas = document.createElement("canvas");
  canvas.id = "live2dcanvas";
  canvas.style.position = "fixed";
  canvas.style.zIndex = String(PET_CANVAS_Z);
  canvas.style.opacity = "1";
  canvas.style.transition = "opacity 0.4s ease";
  canvas.style.pointerEvents = "none";
  if (o.position === "left") canvas.style.left = "0px";
  else canvas.style.right = "0px";
  canvas.style.bottom = `${20 + o.bottomOffset}px`;
  // 触屏按 mobileScale 缩小 CSS 尺寸(渲染分辨率不变), 保持底部贴齐
  if (o.isTouch && o.mobileScale !== 1) {
    canvas.style.width = `${Math.round(o.cssW * o.mobileScale)}px`;
    canvas.style.height = `${Math.round(o.cssH * o.mobileScale)}px`;
  } else {
    canvas.style.width = `${o.cssW}px`;
    canvas.style.height = `${o.cssH}px`;
  }
  document.body.appendChild(canvas);

  const app = new PIXI.Application({
    view: canvas,
    width: logicalW,
    height: logicalH,
    resolution: 1,
    backgroundAlpha: 0,
    antialias: true,
    autoStart: true,
  });

  const rel = o.modelPath.replace(/^\/?live2d\/models\//, "").replace(/^\//, "");
  const model = await Live2DModel.from(`/live2d/models/${rel}`, { autoUpdate: true });
  if (model.automator) {
    model.automator.autoHitTest = false;
    model.automator.autoFocus = false;
  }
  model.anchor.set(0.5, 1);
  const mh = model.height || logicalH;
  model.scale.set(logicalH / mh);
  model.position.set(logicalW / 2, logicalH);
  app.stage.addChild(model);

  const idleTimer = setInterval(() => {
    try {
      model.motion("", randMotionIdx(), MotionPriority.NORMAL);
    } catch {
      /* noop */
    }
  }, 12000 + Math.random() * 8000);

  // 外层(点击/抚摸/喂食/生气)调用的真实动作入口
  (canvas as any).__petMotion = () => {
    try {
      model.motion("", randMotionIdx(), MotionPriority.FORCE);
      return true;
    } catch {
      return false;
    }
  };

  return { key: "", canvas, app, idleTimer };
}

function buildKey(o: CreateOpts): string {
  return JSON.stringify([
    o.modelPath, o.cssW, o.cssH, o.mobileScale, o.position, o.bottomOffset, o.isTouch,
  ]);
}

export default function Live2DRenderer({
  modelPath,
  width,
  mobileScale,
  position,
  bottomOffset,
  isTouch,
  onReady,
  onError,
}: Live2DRendererProps) {
  const cbRef = useRef({ onReady, onError });
  cbRef.current = { onReady, onError };

  useEffect(() => {
    const cssW = Math.round(width);
    const cssH = Math.round(width * 2);
    const opts: CreateOpts = { modelPath, cssW, cssH, mobileScale, position, bottomOffset, isTouch };
    const key = buildKey(opts);
    let cancelled = false;

    (async () => {
      // 同 key 实例已存在(复用挂起销毁 / strict 双挂载 / 隐藏恢复) → 直接复用
      if (sharedPet && sharedPet.key === key) {
        cancelDestroy();
        if (!cancelled) cbRef.current.onReady(sharedPet.canvas);
        return;
      }
      // 不同 key → 销毁旧实例
      if (sharedPet) {
        destroyPet(sharedPet);
        sharedPet = null;
      }
      cancelDestroy();
      let pet: PetHandle | null = null;
      try {
        pet = await createPet(opts);
        pet.key = key;
      } catch (e) {
        console.error("[pet] live2d init failed:", e);
        if (!cancelled) cbRef.current.onError?.();
        return;
      }
      if (cancelled) {
        destroyPet(pet);
        return;
      }
      sharedPet = pet;
      cbRef.current.onReady(pet.canvas);
    })();

    return () => {
      cancelled = true;
      // 卸载 → 延迟销毁; 若马上又挂载(同 key)会被复用路径取消
      if (sharedPet) scheduleDestroy(120);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelPath, width, mobileScale, position, bottomOffset, isTouch]);

  return null;
}
