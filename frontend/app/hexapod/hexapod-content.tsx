"use client";

import { useEffect, useRef, useState } from "react";
import type { SceneAPI } from "@/lib/hexapod-scene";

/** 跟 lib/hexapod-scene.ts 的 CFG.legNames 保持一致 */
const LEGS = [
  { idx: 0, name: "右中" },
  { idx: 1, name: "右前" },
  { idx: 2, name: "左前" },
  { idx: 3, name: "左中" },
  { idx: 4, name: "左后" },
  { idx: 5, name: "右后" },
];
const JOINTS = ["coxa", "femur", "tibia"] as const;

export default function HexapodContent() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<SceneAPI | null>(null);

  const [gait, setGait] = useState(0);
  const [speed, setSpeed] = useState(45);
  const [lift, setLift] = useState(50);
  const [stopped, setStopped] = useState(false);
  const [autoDemo, setAutoDemo] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let api: SceneAPI | null = null;

    (async () => {
      try {
        // 动态引入：SSR 阶段完全不碰 three，避免 window 访问问题
        const mod = await import("@/lib/hexapod-scene");
        // isConnected 检查：StrictMode 下第一次挂载的容器可能已经脱离文档
        if (cancelled || !rootRef.current || !rootRef.current.isConnected) return;

        const inst = mod.initHexapod(rootRef.current);
        // 竞态兜底：init 期间组件被卸载了，立刻清理，别留下野 canvas
        if (cancelled) {
          inst.dispose();
          return;
        }
        api = inst;
        apiRef.current = inst;
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
      api?.dispose();
      apiRef.current = null;
    };
  }, []);

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-8 pb-14 sm:px-6">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">
          六足机器人 <span className="text-[rgb(var(--color-accent))]">本机调试台</span>
        </h1>
        <p className="mt-1.5 text-sm text-[rgb(var(--color-text-muted))]">
          手柄实时驱动 18 个舵机，三角步态。右侧角度可直接对照真机刻度 ——
          <span className="text-[rgb(var(--color-text))]">舵机角 = 90 + 关节偏角</span>。
        </p>
      </header>

      {err && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          3D 场景初始化失败：{err}
        </div>
      )}

      <div
        ref={rootRef}
        className="flex flex-col overflow-hidden rounded-xl border border-[rgb(var(--color-border))] lg:h-[78vh] lg:min-h-[620px] lg:flex-row"
      >
        {/* 3D 区 */}
        <div
          data-stage
          className="relative min-h-[420px] flex-1 overflow-hidden bg-[#0b0d12] lg:min-h-0"
        >
          <div className="pointer-events-none absolute left-4 top-4 text-[11px] tracking-wide text-white/35">
            HEXAPOD <span className="text-[#c084fc]">18 DOF</span> · GAIT SIMULATOR
          </div>
          <div
            data-padstate
            className="pointer-events-none absolute right-4 top-4 text-right text-[11px] leading-relaxed text-white/40"
          >
            正在初始化…
          </div>
          <div className="pointer-events-none absolute left-4 top-9 text-[11px] leading-relaxed text-white/25">
            拖拽旋转 · 滚轮缩放 · 右键平移
          </div>

          {/* 悬浮控制条 */}
          <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#111620]/90 px-4 py-2.5 backdrop-blur">
            <span className="text-[11px] text-white/45">步态</span>
            <button
              type="button"
              onClick={() => {
                const n = (gait + 1) % 2;
                setGait(n);
                apiRef.current?.setGait(n);
              }}
              className={`rounded-lg border px-3 py-1 text-xs transition ${
                gait === 0
                  ? "border-[#0ea5e9] bg-[#0ea5e9]/15 text-[#0ea5e9]"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-[#0ea5e9]/60"
              }`}
            >
              {gait === 0 ? "三角步态" : "波纹步态"}
            </button>

            <span className="text-[11px] text-white/45">速度</span>
            <input
              type="range"
              min={0}
              max={100}
              value={speed}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSpeed(v);
                apiRef.current?.setSpeed(v / 100);
              }}
              className="h-1 w-28 cursor-pointer appearance-none rounded bg-white/15 accent-[#0ea5e9]"
            />
            <span className="w-9 text-[11px] tabular-nums text-white/50">{speed}%</span>

            <span className="text-[11px] text-white/45">抬腿</span>
            <input
              type="range"
              min={0}
              max={100}
              value={lift}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLift(v);
                apiRef.current?.setLift(v / 100);
              }}
              className="h-1 w-24 cursor-pointer appearance-none rounded bg-white/15 accent-[#0ea5e9]"
            />

            <button
              type="button"
              onClick={() => {
                setStopped(!stopped);
                apiRef.current?.toggleStop();
              }}
              className={`rounded-lg border px-3 py-1 text-xs transition ${
                stopped
                  ? "border-[#ff6b6b] bg-[#ff6b6b]/15 text-[#ff6b6b]"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-[#ff6b6b]/60"
              }`}
            >
              急停
            </button>

            <button
              type="button"
              onClick={() => {
                setAutoDemo(!autoDemo);
                apiRef.current?.toggleAuto();
              }}
              className={`rounded-lg border px-3 py-1 text-xs transition ${
                autoDemo
                  ? "border-[#2bd6a0] bg-[#2bd6a0]/15 text-[#2bd6a0]"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-[#2bd6a0]/60"
              }`}
            >
              自动演示
            </button>

            <span className="ml-auto text-[11px] tabular-nums text-white/35" data-fps>
              —
            </span>
          </div>
        </div>

        {/* 18 舵机读数 */}
        <aside
          data-servos
          className="w-full flex-none overflow-y-auto border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg-soft))] p-3.5 lg:w-[300px] lg:border-l lg:border-t-0"
        >
          <div className="mb-2.5 px-1 text-[13px] font-medium">
            18 舵机角度 <span className="text-[rgb(var(--color-accent))]">· 实时</span>
          </div>

          {LEGS.map((leg) => (
            <div key={leg.idx} className="mb-3">
              <div className="mb-1 flex items-center justify-between px-1 text-[11px] text-[rgb(var(--color-text-muted))]">
                <span>{leg.name}腿</span>
                <em className="not-italic text-[rgb(var(--color-accent))]">#{leg.idx}</em>
              </div>
              {JOINTS.map((j) => (
                <div key={j} className="mb-1 flex items-center gap-2 px-1">
                  <span className="w-11 flex-none font-mono text-[10px] text-[rgb(var(--color-text-muted))]">
                    {j}
                  </span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[rgb(var(--color-bg-mute))]">
                    <span className="absolute left-1/2 top-0 h-full w-px bg-[rgb(var(--color-border-hover))]" />
                    <div
                      data-bar={`leg${leg.idx}-${j}`}
                      className="absolute top-0 h-full rounded-full bg-[rgb(var(--color-accent))]"
                      style={{ left: "50%", width: 0 }}
                    />
                  </div>
                  <span
                    data-val={`leg${leg.idx}-${j}`}
                    className="w-12 flex-none text-right font-mono text-[10px] tabular-nums text-[rgb(var(--color-text-muted))]"
                  >
                    90.0°
                  </span>
                </div>
              ))}
            </div>
          ))}

          <div className="mt-3 border-t border-[rgb(var(--color-border))] pt-2.5 px-1 text-[10px] leading-relaxed text-[rgb(var(--color-text-muted))]">
            <div>
              左摇杆 <b className="text-[rgb(var(--color-text))]">前后 / 横移</b>
            </div>
            <div>
              右摇杆 <b className="text-[rgb(var(--color-text))]">转向 / 升降</b>
            </div>
            <div>
              <b className="text-[rgb(var(--color-text))]">LB</b> 换步态 ·{" "}
              <b className="text-[rgb(var(--color-text))]">A</b> 急停 ·{" "}
              <b className="text-[rgb(var(--color-text))]">Back</b> 高度回中
            </div>
            <div className="mt-1 opacity-70">没手柄时：WASD 平移 · QE 转向 · R/F 升降</div>
          </div>
        </aside>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-[rgb(var(--color-text-muted))]">
        腿长参数写在 <code className="rounded bg-[rgb(var(--color-bg-soft))] px-1 py-0.5 font-mono">lib/hexapod-scene.ts</code> 的
        <code className="mx-1 rounded bg-[rgb(var(--color-bg-soft))] px-1 py-0.5 font-mono">CFG</code>
        （cox 25 / femur 55 / tibia 90 mm）。硬件到货后改成实测值，模型与角度表会自动跟着变。
        当前步态是相位表 + 正弦抬腿的简化算法，不是解析 IK；真机装配后会用实测腿长生成完整角度表替换。
      </p>
    </div>
  );
}
