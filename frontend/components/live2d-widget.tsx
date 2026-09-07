"use client";

/**
 * Live2D 纯渲染器(瘦身版, 2026-09-07)
 * 只负责: 加载 L2Dwidget 老库 → init 模型 → 把 canvas 交给外层。
 * 所有对话/互动/动画/好感度都在 pet-cat.tsx 外层实现。
 *
 * 移动端缩放策略(实测库行为后确定):
 * 老库 mobile.scale 只缩放"模型逻辑视口"(canvas 元素尺寸不变), 且
 * `!mobile.show && UA.isMobile()` 会短路跳过初始化。因此本渲染器
 * 固定传 mobile:{show:true, scale:1} 保证任何设备都初始化, 触屏设备
 * 由本层直接改 canvas CSS width/height 实现整体缩放(不动 transform,
 * 避免与外层 jump/eat 动画及桌面拖拽的 transform 冲突)。
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
  /** canvas 就绪回调(已设置 z-index/pointer-events) */
  onReady: (canvas: HTMLElement) => void;
  onError?: () => void;
}

/** 渲染器需要高于粒子 canvas(z 2147483000) */
export const PET_CANVAS_Z = 2147483001;
export const PET_UI_Z = 2147483002;

function cleanupCanvas() {
  const old = document.getElementById("live2dcanvas");
  if (old) old.remove();
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
  const startedRef = useRef(false);
  const cancelledRef = useRef(false);
  const cbRef = useRef({ onReady, onError });
  cbRef.current = { onReady, onError };

  useEffect(() => {
    cancelledRef.current = false;
    startedRef.current = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let script: HTMLScriptElement | null = null;

    function normalizePath(p: string): string {
      return p.replace(/^\/?live2d\/models\//, "").replace(/^\//, "");
    }

    function start() {
      if (cancelledRef.current || startedRef.current) return;
      // @ts-ignore
      if (typeof L2Dwidget === "undefined") return;
      startedRef.current = true;
      cleanupCanvas();
      // @ts-ignore
      L2Dwidget.init({
        pluginRootPath: "/live2d/",
        pluginJsPath: "/live2d/",
        pluginModelPath: "/live2d/models/",
        model: { jsonPath: normalizePath(modelPath), scale: 1 },
        display: {
          superSample: 2,
          width,
          height: Math.round(width * 2),
          position,
          hOffset: 0,
          vOffset: -(20 + bottomOffset),
        },
        // 固定 show:true(防 UA mobile + show:false 短路不渲染), scale 由本层 CSS 缩放
        mobile: { show: true, scale: 1 },
        react: { opacityDefault: 1, opacityOnHover: 1 },
        dialog: { enable: false },
      });
      // 轮询等待 canvas 出现(模型加载完成)
      let tries = 0;
      pollTimer = setInterval(() => {
        if (cancelledRef.current) return;
        const canvas = document.getElementById("live2dcanvas");
        if (canvas) {
          if (pollTimer) clearInterval(pollTimer);
          canvas.style.zIndex = String(PET_CANVAS_Z);
          canvas.style.opacity = "1";
          canvas.style.transition = "opacity 0.4s ease";
          // 库的 canvas CSS 尺寸设置时机不可靠(模型加载回调), 这里无条件显式控制:
          // 桌面 = display 尺寸; 触屏 = ×mobileScale 且容器内底对齐(视觉+命中一致, 不碰 transform)
          const fullH = Math.round(width * 2);
          if (isTouch && mobileScale !== 1) {
            const cssH = Math.round(fullH * mobileScale);
            canvas.style.width = `${Math.round(width * mobileScale)}px`;
            canvas.style.height = `${cssH}px`;
            canvas.style.top = `${fullH - cssH}px`;
          } else {
            canvas.style.width = `${width}px`;
            canvas.style.height = `${fullH}px`;
            canvas.style.top = "0px";
          }
          cbRef.current.onReady(canvas);
        } else if (++tries > 60) {
          if (pollTimer) clearInterval(pollTimer);
          cbRef.current.onError?.();
        }
      }, 150);
    }

    function tryStart() {
      // @ts-ignore
      if (typeof L2Dwidget !== "undefined") {
        start();
        return;
      }
      const s = document.createElement("script");
      s.src = "/live2d/L2Dwidget.min.js";
      s.async = true;
      s.onload = start;
      s.onerror = () => {
        const cdn = document.createElement("script");
        cdn.src = "https://cdn.jsdelivr.net/npm/live2d-widget@3.1.4/lib/L2Dwidget.min.js";
        cdn.async = true;
        cdn.onload = start;
        cdn.onerror = () => cbRef.current.onError?.();
        document.body.appendChild(cdn);
      };
      document.body.appendChild(s);
      script = s;
    }

    tryStart();

    return () => {
      cancelledRef.current = true;
      if (pollTimer) clearInterval(pollTimer);
      if (script) script.remove();
      // 延迟清理, 避免 init 异步完成后又把 canvas 建回来
      setTimeout(() => {
        if (cancelledRef.current) cleanupCanvas();
      }, 100);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelPath, width, position, bottomOffset, isTouch, mobileScale]);

  return null;
}
