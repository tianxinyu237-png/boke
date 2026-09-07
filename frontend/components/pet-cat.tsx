"use client";

/**
 * 看板猫互动层 (2026-09-07)
 * 职责: 配置读取/同步(本地+服务器) → Live2D 渲染器挂载 → 气泡/互动/好感度/拖拽/动画。
 * 渲染细节在 live2d-widget.tsx(Live2DRenderer), 本组件不直接碰 L2Dwidget。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Live2DRenderer, { PET_UI_Z } from "@/components/live2d-widget";
import {
  CONFIG_KEY,
  HIDDEN_KEY,
  loadPetConfig,
  savePetConfig,
  loadPetConfigFromServer,
  pickLine,
  loadPetState,
  applyAffection,
  getLevelName,
  matchPage,
  LEVELS,
  type PetConfig,
} from "@/lib/pet";

const PET_HOLD_MS = 600; // 长按=抚摸
const CLICK_MAX_MS = 600; // 短按=点击
const CLICK_WINDOW_MS = 1500;
const ANGRY_COUNT = 5;
const LEVELUP_DELAY_MS = 900;

let uid = 0;

interface DragState {
  down: boolean;
  moved: boolean;
  dragging: boolean;
  petFired: boolean;
  x0: number;
  y0: number;
  t0: number;
  petTimer: ReturnType<typeof setTimeout> | null;
}

export default function PetCat() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  // 配置: 本地优先, mount 后服务器覆盖; 后台保存经 storage/customEvent 实时生效
  const [cfg, setCfg] = useState<PetConfig>(() => loadPetConfig());
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  const [isTouch, setIsTouch] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(HIDDEN_KEY) === "1";
    } catch {
      return false;
    }
  });

  // Live2D canvas 就绪后才有定位基准
  const [canvas, setCanvas] = useState<HTMLElement | null>(null);
  const uiRef = useRef<HTMLDivElement>(null);

  // 气泡(打字机)
  const [bubbleFull, setBubbleFull] = useState("");
  const [bubbleShown, setBubbleShown] = useState("");
  const bubbleFullRef = useRef("");
  const typeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 动画 & 浮层元素
  const [anim, setAnim] = useState<{ name: string; ts: number } | null>(null);
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fish, setFish] = useState<number | null>(null);
  const [rises, setRises] = useState<{ id: number; text: string }[]>([]);

  // 好感度
  const [affection, setAffection] = useState(() => loadPetState().affection);
  const affectionRef = useRef(affection);
  affectionRef.current = affection;

  // 拖拽状态
  const dragRef = useRef<DragState>({
    down: false,
    moved: false,
    dragging: false,
    petFired: false,
    x0: 0,
    y0: 0,
    t0: 0,
    petTimer: null,
  });
  const clicksRef = useRef<number[]>([]);
  const didWelcomeRef = useRef(false);

  const showPage = matchPage(pathname, cfg.pageMode, cfg.includePaths, cfg.excludePaths);
  const visible = cfg.enabled && showPage && !isAdmin && !hidden;
  const showDot = cfg.enabled && showPage && !isAdmin && hidden;

  // ── 触屏判定(用 hover 能力, 避免 1366x768 笔记本被当移动端) ──
  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // ── 配置同步 ──
  useEffect(() => {
    let cancelled = false;
    loadPetConfigFromServer().then((remote) => {
      if (cancelled || !remote) return;
      const local = loadPetConfig();
      if (JSON.stringify(remote) !== JSON.stringify(local)) {
        savePetConfig(remote);
        setCfg(remote);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const applyLocal = () => setCfg(loadPetConfig());
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONFIG_KEY) applyLocal();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pet-config-change", applyLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pet-config-change", applyLocal);
    };
  }, []);

  // ── 位置锚定: UI 层跟随 canvas rect ──
  const positionUi = useCallback(() => {
    if (!canvas || !uiRef.current) return;
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const el = uiRef.current;
    el.style.left = `${r.left}px`;
    el.style.top = `${r.top}px`;
    el.style.width = `${r.width}px`;
    el.style.height = `${r.height}px`;
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;
    positionUi();
    const ro = new ResizeObserver(() => positionUi());
    ro.observe(canvas);
    window.addEventListener("resize", positionUi);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", positionUi);
    };
  }, [canvas, positionUi]);

  // canvas 动画 class 挂载/卸载
  useEffect(() => {
    if (!canvas) return;
    const CLS = ["pet-anim-jump", "pet-anim-angry", "pet-anim-eat"];
    CLS.forEach((c) => canvas.classList.remove(c));
    if (anim) {
      canvas.classList.add(`pet-anim-${anim.name}`);
      const d = anim.name === "jump" ? 700 : anim.name === "angry" ? 600 : 850;
      animTimer.current = setTimeout(() => setAnim(null), d + 100);
    }
    return () => {
      if (animTimer.current) clearTimeout(animTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim, canvas]);

  // 透明度(idle/hover)
  useEffect(() => {
    if (!canvas) return;
    canvas.style.opacity = String(hovered ? cfg.opacityOnHover : cfg.opacityDefault);
  }, [cfg.opacityDefault, cfg.opacityOnHover, hovered, canvas]);

  // ── 气泡引擎 ──
  const sayText = useCallback((raw: string | null | undefined) => {
    if (!raw || !cfgRef.current.enabled) return;
    if (typeTimer.current) clearInterval(typeTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    bubbleFullRef.current = raw;
    setBubbleFull(raw);
    setBubbleShown("");
    let i = 0;
    typeTimer.current = setInterval(() => {
      i += 1;
      setBubbleShown(raw.slice(0, i));
      if (i >= raw.length) {
        if (typeTimer.current) clearInterval(typeTimer.current);
        typeTimer.current = null;
        const ms = cfgRef.current.bubbleSeconds * 1000;
        hideTimer.current = setTimeout(() => {
          hideTimer.current = null;
          bubbleFullRef.current = "";
          setBubbleFull("");
          setBubbleShown("");
          resetIdle();
        }, ms);
      }
    }, 22);
  }, []);

  const closeBubble = useCallback(() => {
    if (typeTimer.current) clearInterval(typeTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    typeTimer.current = null;
    hideTimer.current = null;
    bubbleFullRef.current = "";
    setBubbleFull("");
    setBubbleShown("");
    resetIdle();
  }, []);

  const resetIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = null;
    if (!cfgRef.current.idleEnabled) return;
    idleTimer.current = setTimeout(() => {
      idleTimer.current = null;
      if (!bubbleFullRef.current) {
        sayText(pickLine(cfgRef.current.idleLines, cfgRef.current.petName));
      }
    }, cfgRef.current.idleInterval * 1000);
  }, [sayText]);

  // ── 好感度 ──
  const useFeel = useCallback(
    (delta: number, riseText?: string) => {
      const enabled = cfgRef.current.feelingsEnabled;
      const prevLevel = getLevelIdx(affectionRef.current);
      const r = enabled
        ? applyAffection(delta, cfgRef.current.dailyMax)
        : { added: 0, state: loadPetState(), prevLevel, newLevel: prevLevel };
      setAffection(r.state.affection);
      if (riseText && r.added > 0) {
        const id = ++uid;
        setRises((prev) => [...prev.slice(-2), { id, text: riseText }]);
        setTimeout(() => setRises((prev) => prev.filter((x) => x.id !== id)), 1600);
      }
      return { levelUp: enabled && r.newLevel > prevLevel, newLevel: r.newLevel };
    },
    []
  );

  function getLevelIdx(a: number): number {
    let idx = 0;
    for (let i = 0; i < LEVELS.length; i++) {
      if (Math.floor(a) >= LEVELS[i].min) idx = i;
    }
    return idx;
  }

  function levelUpLine(levelIdx: number): string {
    const name = LEVELS[levelIdx]?.name ?? "";
    const raw = pickLine(cfgRef.current.levelUpLines, cfgRef.current.petName);
    return raw ? raw.replace(/%s/g, name) : `羁绊升级：${name}！`;
  }

  function sayWithLevelUp(
    levelUp: boolean,
    newLevel: number,
    primary: string | null | undefined
  ) {
    sayText(primary);
    if (levelUp) {
      setTimeout(() => sayText(levelUpLine(newLevel)), LEVELUP_DELAY_MS);
    }
  }

  // ── 互动动作 ──
  const doClick = useCallback(() => {
    setAnim({ name: "jump", ts: Date.now() });
    sayText(pickLine(cfgRef.current.clickLines, cfgRef.current.petName));
    const { levelUp, newLevel } = useFeel(0.2);
    if (levelUp) setTimeout(() => sayText(levelUpLine(newLevel)), LEVELUP_DELAY_MS);
    resetIdle();
  }, [resetIdle, sayText, useFeel]);

  const doPet = useCallback(() => {
    const d = dragRef.current;
    d.petFired = true;
    setAnim({ name: "eat", ts: Date.now() });
    const { levelUp, newLevel } = useFeel(1, "+1 ♥");
    sayWithLevelUp(levelUp, newLevel, pickLine(cfgRef.current.petLines, cfgRef.current.petName));
    resetIdle();
  }, [resetIdle, sayText, useFeel]); // eslint-disable-line react-hooks/exhaustive-deps

  const doFeedStart = useCallback(() => {
    setFish((f) => (f ? f : ++uid));
    resetIdle();
  }, [resetIdle]);

  const doFeedEnd = useCallback(() => {
    setFish(null);
    setAnim({ name: "eat", ts: Date.now() });
    const { levelUp, newLevel } = useFeel(2, "+2 ♥");
    sayWithLevelUp(levelUp, newLevel, pickLine(cfgRef.current.feedLines, cfgRef.current.petName));
    resetIdle();
  }, [resetIdle, sayText, useFeel]); // eslint-disable-line react-hooks/exhaustive-deps

  const doHide = useCallback(() => {
    try {
      sessionStorage.setItem(HIDDEN_KEY, "1");
    } catch {}
    setHidden(true);
  }, []);

  const doShow = useCallback(() => {
    try {
      sessionStorage.removeItem(HIDDEN_KEY);
    } catch {}
    setHidden(false);
  }, []);

  // ── 欢迎(每 session 一次) ──
  useEffect(() => {
    if (!canvas || !visible || !cfg.welcomeEnabled) return;
    if (didWelcomeRef.current) return;
    didWelcomeRef.current = true;
    let welcomed = false;
    try {
      welcomed = sessionStorage.getItem("devlog-pet-welcomed") === "1";
      sessionStorage.setItem("devlog-pet-welcomed", "1");
    } catch {}
    if (!welcomed) {
      const t = setTimeout(
        () => sayText(pickLine(cfgRef.current.welcomeLines, cfgRef.current.petName)),
        900
      );
      return () => clearTimeout(t);
    }
  }, [canvas, visible, cfg.welcomeEnabled, sayText]);

  // 首次就绪/恢复显示时初始化 idle
  useEffect(() => {
    if (canvas && visible) {
      positionUi();
      resetIdle();
    }
  }, [canvas, visible, positionUi, resetIdle]);

  // ── 指针交互(点/长按抚摸/拖拽) ──
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const d = dragRef.current;
    d.down = true;
    d.moved = false;
    d.dragging = false;
    d.petFired = false;
    d.x0 = e.clientX;
    d.y0 = e.clientY;
    d.t0 = Date.now();
    if (d.petTimer) clearTimeout(d.petTimer);
    d.petTimer = setTimeout(() => {
      if (dragRef.current.down && !dragRef.current.moved && !dragRef.current.dragging) {
        doPet();
      }
    }, PET_HOLD_MS);
    // 指针捕获在部分环境(触屏仿真/非活跃指针)会抛 NotFoundError 中断 handler,
    // 猫区域小、点击判定不需要捕获(仅拖出界时会丢 move/up), 忽略失败即可。
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }
  }, [doPet]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d.down) return;
      const dx = e.clientX - d.x0;
      const dy = e.clientY - d.y0;
      const canDrag = cfgRef.current.dragEnabled && !isTouch && !anim;
      if (!d.moved && Math.abs(dx) > 6 && Math.abs(dy) < 40 && canDrag) {
        d.moved = true;
        d.dragging = true;
        if (d.petTimer) clearTimeout(d.petTimer);
        d.petTimer = null;
      }
      if (d.dragging && canvas) {
        canvas.style.transition = "none";
        canvas.style.transform = `translateX(${dx}px)`;
        positionUi();
      }
    },
    [isTouch, anim, canvas, positionUi]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d.down) return;
      d.down = false;
      if (d.petTimer) clearTimeout(d.petTimer);
      d.petTimer = null;
      if (d.dragging) {
        d.dragging = false;
        if (canvas) {
          canvas.style.transition = "transform 0.45s cubic-bezier(0.22, 1.4, 0.36, 1)";
          canvas.style.transform = "";
          setTimeout(() => {
            if (canvas) canvas.style.transition = "";
            positionUi();
          }, 520);
        }
        return;
      }
      if (!d.moved && !d.petFired) {
        const dur = Date.now() - d.t0;
        if (dur < CLICK_MAX_MS) {
          // 连点计数优先(气泡显示中狂点也累计, 防止被"点气泡关闭"抢占)
          const now = Date.now();
          clicksRef.current = clicksRef.current.filter((t) => now - t < CLICK_WINDOW_MS);
          clicksRef.current.push(now);
          if (clicksRef.current.length >= ANGRY_COUNT) {
            clicksRef.current = [];
            setAnim({ name: "angry", ts: now });
            sayText(pickLine(cfgRef.current.angryLines, cfgRef.current.petName));
            resetIdle();
            return;
          }
          if (bubbleFullRef.current) {
            closeBubble();
          } else {
            doClick();
          }
        }
      }
    },
    [canvas, positionUi, closeBubble, doClick]
  );

  // ── 渲染 ──
  if (!visible) {
    if (showDot) {
      return (
        <button
          aria-label="显示小猫"
          title={`${cfg.petName} · 好感 ${Math.floor(affection)} · ${getLevelName(affection)}`}
          onClick={doShow}
          className="pet-dot fixed w-3 h-3 rounded-full bg-accent/60 hover:bg-accent cursor-pointer transition-colors"
          style={{
            ...(cfg.position === "left" ? { left: 14 } : { right: 14 }),
            bottom: 12,
            zIndex: PET_UI_Z,
          }}
        />
      );
    }
    return null;
  }

  return (
    <>
      {isTouch !== null && (
        <Live2DRenderer
          modelPath={cfg.modelPath}
          width={cfg.width}
          mobileScale={cfg.mobileScale}
          position={cfg.position}
          bottomOffset={cfg.bottomOffset}
          isTouch={isTouch}
          onReady={(c) => setCanvas(c)}
        />
      )}
      {canvas && (
        <div
          ref={uiRef}
          className="fixed"
          style={{ zIndex: PET_UI_Z, pointerEvents: "none" }}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          {/* 气泡(悬于猫头上方, 点击可关闭) */}
          {bubbleFull && (
            <div
              className="pet-bubble-in absolute px-3 py-2 rounded-xl text-[12px] leading-relaxed max-w-[240px] select-none"
              style={{
                bottom: "calc(100% + 10px)",
                ...(cfg.position === "left" ? { left: 0 } : { right: 0 }),
                background: "rgb(var(--color-bg) / 0.94)",
                border: "1px solid rgb(var(--color-accent) / 0.35)",
                color: "rgb(var(--color-text))",
                backdropFilter: "blur(6px)",
                boxShadow: "0 8px 24px rgb(0 0 0 / 0.25)",
                pointerEvents: "auto",
              }}
              onClick={closeBubble}
            >
              <span
                className="absolute w-2 h-2 rotate-45"
                style={{
                  background: "rgb(var(--color-bg) / 0.94)",
                  ...(cfg.position === "left" ? { left: 22 } : { right: 22 }),
                  bottom: -5,
                  borderRight: "1px solid rgb(var(--color-accent) / 0.35)",
                  borderBottom: "1px solid rgb(var(--color-accent) / 0.35)",
                }}
              />
              {bubbleShown}
              <span
                className="ml-0.5 inline-block w-[2px] h-[13px] align-middle transition-opacity"
                style={{
                  background: "rgb(var(--color-accent))",
                  opacity: bubbleShown.length < bubbleFull.length ? 0.9 : 0,
                }}
              />
            </div>
          )}

          {/* 交互层(覆盖猫身) */}
          <div
            className="absolute inset-0"
            style={{
              pointerEvents: "auto",
              touchAction: "none",
              cursor: dragRef.current.dragging ? "grabbing" : "pointer",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />

          {/* 操作条(喂/摸/隐藏) — 桌面 hover 显示, 触屏常驻 */}
          <div
            className="absolute top-1/2 -translate-y-1/2 flex flex-col gap-1.5 transition-opacity duration-200"
            style={{
              ...(cfg.position === "left"
                ? { left: "calc(100% + 4px)" }
                : { right: "calc(100% + 4px)" }),
              opacity: isTouch ? 0.85 : hovered ? 1 : 0,
              pointerEvents: "auto",
            }}
          >
            {[
              { icon: "🐟", title: "喂小鱼干(+2)", act: doFeedStart },
              {
                icon: "♥",
                title: `摸摸头(+1) · 好感 ${Math.floor(affection)} · ${getLevelName(affection)}`,
                act: doPet,
              },
              { icon: "✕", title: "隐藏小猫", act: doHide },
            ].map((b) => (
              <button
                key={b.icon}
                title={b.title}
                onClick={(e) => {
                  e.stopPropagation();
                  b.act();
                }}
                className="w-7 h-7 rounded-full text-[13px] leading-none flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                style={{
                  background: "rgb(var(--color-bg) / 0.92)",
                  border: "1px solid rgb(var(--color-accent) / 0.4)",
                  color: "rgb(var(--color-accent))",
                  boxShadow: "0 4px 12px rgb(0 0 0 / 0.2)",
                }}
              >
                {b.icon}
              </button>
            ))}
          </div>

          {/* 加分飘字 */}
          {rises.map((r) => (
            <span
              key={r.id}
              className="pet-rise absolute text-[13px] font-bold"
              style={{
                left: "50%",
                top: 4,
                color: "rgb(var(--color-accent))",
                pointerEvents: "none",
              }}
            >
              {r.text}
            </span>
          ))}

          {/* 小鱼干(飞向猫嘴) */}
          {fish !== null && (
            <span
              key={fish}
              className={`pet-fish-${cfg.position === "left" ? "left" : "right"} absolute text-[22px]`}
              style={{
                left: "32%",
                top: "18%",
                pointerEvents: "none",
                filter: "drop-shadow(0 2px 6px rgb(0 0 0 / 0.35))",
              }}
              onAnimationEnd={doFeedEnd}
            >
              🐟
            </span>
          )}
        </div>
      )}
    </>
  );
}
