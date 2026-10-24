"use client";

/**
 * 手柄遥控台 —— 浏览器 Gamepad API 实时可视化
 *
 * 为什么不走 React state 每帧渲染：
 * 轮询是 60Hz，用 setState 会每帧重渲整棵子树。
 * 这里用 ref 直接改 SVG / 文本节点，React 只负责骨架。
 */

import { useEffect, useRef, useState } from "react";

const DEADZONE = 0.08;

const BTN_LABEL: Record<number, string> = {
  0: "A", 1: "B", 2: "X", 3: "Y",
  4: "LB", 5: "RB", 6: "LT", 7: "RT",
  8: "Back", 9: "Start", 10: "左摇杆按下", 11: "右摇杆按下",
  12: "↑", 13: "↓", 14: "←", 15: "→", 16: "指南键",
};

type AxisRow = { key: string; label: string; signed: boolean };

const AXES: AxisRow[] = [
  { key: "LX", label: "LX", signed: true },
  { key: "LY", label: "LY", signed: true },
  { key: "RX", label: "RX", signed: true },
  { key: "RY", label: "RY", signed: true },
  { key: "LT", label: "LT", signed: false },
  { key: "RT", label: "RT", signed: false },
];

export default function GamepadContent() {
  const [connected, setConnected] = useState(false);
  const [padId, setPadId] = useState("");
  const [pressed, setPressed] = useState<string[]>([]);

  const lsKnob = useRef<SVGCircleElement | null>(null);
  const rsKnob = useRef<SVGCircleElement | null>(null);
  const lsBase = useRef<SVGGElement | null>(null);
  const rsBase = useRef<SVGGElement | null>(null);
  const ltBar = useRef<SVGRectElement | null>(null);
  const rtBar = useRef<SVGRectElement | null>(null);
  const barRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const valRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const keyRefs = useRef<Record<number, SVGGElement | null>>({});
  const rawRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    let raf = 0;
    let lastPressed: string[] = [];

    const loop = () => {
      if (!alive) return;

      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      let pad: Gamepad | null = null;
      for (const p of pads) {
        if (p && p.connected) { pad = p; break; }
      }

      if (!pad) {
        setConnected(prev => (prev ? false : prev));
        raf = requestAnimationFrame(loop);
        return;
      }
      setConnected(prev => (prev ? prev : true));
      setPadId(prev => (prev === pad!.id ? prev : pad!.id));

      const ax = pad.axes;
      const bt = pad.buttons;
      const lx = ax[0] ?? 0, ly = ax[1] ?? 0;
      const rx = ax[2] ?? 0, ry = ax[3] ?? 0;
      const lt = bt[6]?.value ?? 0, rt = bt[7]?.value ?? 0;

      const vals: Record<string, number> = { LX: lx, LY: ly, RX: rx, RY: ry, LT: lt, RT: rt };

      for (const { key, signed } of AXES) {
        const v = vals[key];
        const bar = barRefs.current[key];
        const txt = valRefs.current[key];
        if (bar) {
          const pct = Math.abs(v) * 50;
          if (signed) {
            bar.style.width = `${pct}%`;
            bar.style.left = v < 0 ? "auto" : "50%";
            bar.style.right = v < 0 ? "50%" : "auto";
          } else {
            bar.style.width = `${Math.abs(v) * 100}%`;
            bar.style.left = "0";
            bar.style.right = "auto";
          }
          bar.style.opacity = Math.abs(v) > (signed ? DEADZONE : 0.02) ? "1" : "0.35";
        }
        if (txt) {
          txt.textContent = signed
            ? `${v >= 0 ? "+" : ""}${v.toFixed(2)}`
            : `${Math.round(Math.abs(v) * 100)}%`;
          txt.style.color =
            Math.abs(v) > (signed ? DEADZONE : 0.02)
              ? "rgb(var(--color-accent))"
              : "rgb(var(--color-text-muted))";
        }
      }

      // 摇杆圆点
      if (lsKnob.current) {
        lsKnob.current.setAttribute("transform", `translate(${lx * 16}, ${ly * 16})`);
      }
      if (rsKnob.current) {
        rsKnob.current.setAttribute("transform", `translate(${rx * 12}, ${ry * 12})`);
      }
      lsBase.current?.style.setProperty("opacity", Math.hypot(lx, ly) > DEADZONE ? "1" : "0.55");
      rsBase.current?.style.setProperty("opacity", Math.hypot(rx, ry) > DEADZONE ? "1" : "0.55");

      // 扳机填充
      ltBar.current?.setAttribute("width", `${Math.abs(lt) * 100}`);
      rtBar.current?.setAttribute("width", `${Math.abs(rt) * 100}`);

      // 按键高亮
      const nowPressed: string[] = [];
      for (let i = 0; i < Math.min(bt.length, 17); i++) {
        const on = !!bt[i]?.pressed;
        const g = keyRefs.current[i];
        if (g) {
          g.style.opacity = on ? "1" : "0.45";
          g.style.fill = on ? "rgb(var(--color-accent))" : "rgb(var(--color-bg-mute))";
        }
        if (on && BTN_LABEL[i]) nowPressed.push(BTN_LABEL[i]);
      }
      if (nowPressed.join(",") !== lastPressed.join(",")) {
        lastPressed = nowPressed;
        setPressed(nowPressed);
      }

      if (rawRef.current) {
        rawRef.current.textContent =
          `axes[${Array.from(ax).map(v => v.toFixed(2)).join(", ")}]  ` +
          `pressed:${nowPressed.length}  index:${pad.index}`;
      }

      raf = requestAnimationFrame(loop);
    };

    const onConn = (e: GamepadEvent) => { setPadId(e.gamepad.id); };
    window.addEventListener("gamepadconnected", onConn);

    loop();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("gamepadconnected", onConn);
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-24 pb-20 sm:px-6">
      {/* 标题 */}
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          手柄<span className="text-[rgb(var(--color-accent))]">遥控台</span>
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--color-text-muted))]">
          浏览器直接读 XInput 手柄，不用装任何驱动。把手柄插上、按一下任意键，下面就会亮起来。
        </p>
      </header>

      {/* 连接状态 */}
      <div className="mb-6 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface)/var(--color-surface-alpha))] px-4 py-3">
        {connected ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[rgb(var(--color-accent))] shadow-[0_0_8px_rgb(var(--color-accent))]" />
              <b className="font-medium">已连接</b>
            </span>
            <span className="text-[rgb(var(--color-text-muted))]">
              {padId.length > 60 ? padId.slice(0, 60) + "…" : padId}
            </span>
          </div>
        ) : (
          <div className="text-sm text-[rgb(var(--color-text-muted))]">
            未检测到手柄 —— 插好线后
            <b className="mx-1 text-[rgb(var(--color-text))]">按一下手柄任意键</b>
            （浏览器出于安全限制，要有输入才会把设备报出来）
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* 左：手柄示意图 */}
        <div className="rounded-xl border border-[rgb(var(--color-border))] p-4">
          <svg viewBox="0 0 620 400" className="h-auto w-full" role="img" aria-label="手柄示意图">
            {/* 握把 */}
            <rect x="18" y="88" width="172" height="236" rx="86"
              fill="rgb(var(--color-bg-soft))" stroke="rgb(var(--color-border-hover))" vectorEffect="non-scaling-stroke" />
            <rect x="430" y="88" width="172" height="236" rx="86"
              fill="rgb(var(--color-bg-soft))" stroke="rgb(var(--color-border-hover))" vectorEffect="non-scaling-stroke" />
            {/* 主体 */}
            <rect x="108" y="52" width="404" height="212" rx="58"
              fill="rgb(var(--color-bg-soft))" stroke="rgb(var(--color-border-hover))" vectorEffect="non-scaling-stroke" />
            <text x="310" y="118" textAnchor="middle" fontSize="11" letterSpacing="3"
              fill="rgb(var(--color-text-muted))">GAMEPAD · XINPUT</text>

            {/* 扳机 LT / RT */}
            <rect x="118" y="14" width="112" height="12" rx="6" fill="rgb(var(--color-bg-mute))" opacity="0.6" />
            <rect ref={ltBar} x="118" y="14" width="0" height="12" rx="6" fill="rgb(var(--color-accent))" />
            <rect x="390" y="14" width="112" height="12" rx="6" fill="rgb(var(--color-bg-mute))" opacity="0.6" />
            <rect ref={rtBar} x="390" y="14" width="0" height="12" rx="6" fill="rgb(var(--color-accent))" />
            <text x="174" y="42" textAnchor="middle" fontSize="10" fill="rgb(var(--color-text-muted))">LT</text>
            <text x="446" y="42" textAnchor="middle" fontSize="10" fill="rgb(var(--color-text-muted))">RT</text>

            {/* 肩键 LB / RB */}
            <g ref={el => { keyRefs.current[4] = el; }}>
              <rect x="118" y="50" width="112" height="20" rx="10" fill="rgb(var(--color-bg-mute))" />
              <text x="174" y="64" textAnchor="middle" fontSize="10" fill="rgb(var(--color-bg))" fontWeight="600">LB</text>
            </g>
            <g ref={el => { keyRefs.current[5] = el; }}>
              <rect x="390" y="50" width="112" height="20" rx="10" fill="rgb(var(--color-bg-mute))" />
              <text x="446" y="64" textAnchor="middle" fontSize="10" fill="rgb(var(--color-bg))" fontWeight="600">RB</text>
            </g>

            {/* 左摇杆 */}
            <g ref={lsBase}>
              <circle cx="200" cy="158" r="40" fill="rgb(var(--color-bg))" stroke="rgb(var(--color-border-hover))" />
              <circle ref={lsKnob} cx="200" cy="158" r="25" fill="rgb(var(--color-bg-mute))"
                stroke="rgb(var(--color-accent))" strokeWidth="1.5" />
            </g>
            <text x="200" y="222" textAnchor="middle" fontSize="10" fill="rgb(var(--color-text-muted))">左摇杆</text>

            {/* 右摇杆 */}
            <g ref={rsBase}>
              <circle cx="356" cy="242" r="32" fill="rgb(var(--color-bg))" stroke="rgb(var(--color-border-hover))" />
              <circle ref={rsKnob} cx="356" cy="242" r="20" fill="rgb(var(--color-bg-mute))"
                stroke="rgb(var(--color-accent))" strokeWidth="1.5" />
            </g>
            <text x="356" y="292" textAnchor="middle" fontSize="10" fill="rgb(var(--color-text-muted))">右摇杆</text>

            {/* 十字键 */}
            <g>
              <g ref={el => { keyRefs.current[12] = el; }}>
                <rect x="262" y="212" width="22" height="26" rx="4" fill="rgb(var(--color-bg-mute))" />
              </g>
              <g ref={el => { keyRefs.current[13] = el; }}>
                <rect x="262" y="262" width="22" height="26" rx="4" fill="rgb(var(--color-bg-mute))" />
              </g>
              <g ref={el => { keyRefs.current[14] = el; }}>
                <rect x="236" y="238" width="26" height="22" rx="4" fill="rgb(var(--color-bg-mute))" />
              </g>
              <g ref={el => { keyRefs.current[15] = el; }}>
                <rect x="284" y="238" width="26" height="22" rx="4" fill="rgb(var(--color-bg-mute))" />
              </g>
            </g>
            <text x="272" y="312" textAnchor="middle" fontSize="10" fill="rgb(var(--color-text-muted))">十字键</text>

            {/* ABXY */}
            {[
              { i: 3, cx: 440, cy: 172, t: "Y" },
              { i: 0, cx: 440, cy: 226, t: "A" },
              { i: 2, cx: 414, cy: 199, t: "X" },
              { i: 1, cx: 466, cy: 199, t: "B" },
            ].map(b => (
              <g key={b.i} ref={el => { keyRefs.current[b.i] = el; }}>
                <circle cx={b.cx} cy={b.cy} r="17" fill="rgb(var(--color-bg-mute))" />
                <text x={b.cx} y={b.cy + 4.5} textAnchor="middle" fontSize="12" fontWeight="600"
                  fill="rgb(var(--color-bg))">{b.t}</text>
              </g>
            ))}

            {/* Back / Start */}
            <g ref={el => { keyRefs.current[8] = el; }}>
              <circle cx="288" cy="158" r="12" fill="rgb(var(--color-bg-mute))" />
              <text x="288" y="162" textAnchor="middle" fontSize="8" fill="rgb(var(--color-bg))">BK</text>
            </g>
            <g ref={el => { keyRefs.current[9] = el; }}>
              <circle cx="332" cy="158" r="12" fill="rgb(var(--color-bg-mute))" />
              <text x="332" y="162" textAnchor="middle" fontSize="8" fill="rgb(var(--color-bg))">ST</text>
            </g>
          </svg>
        </div>

        {/* 右：数值面板 */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-[rgb(var(--color-border))] p-4">
            <h2 className="mb-3 text-[11px] uppercase tracking-[0.12em] text-[rgb(var(--color-text-muted))]">
              摇杆 / 扳机
            </h2>
            <div className="space-y-2">
              {AXES.map(({ key, label, signed }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-8 shrink-0 font-mono text-[11px] text-[rgb(var(--color-text-muted))]">{label}</span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[rgb(var(--color-bg-mute))]">
                    {signed && (
                      <span className="absolute left-1/2 top-0 h-full w-px bg-[rgb(var(--color-border-hover))]" />
                    )}
                    <div
                      ref={el => { barRefs.current[key] = el; }}
                      className="absolute top-0 h-full rounded-full transition-opacity duration-100"
                      style={{
                        background: "rgb(var(--color-accent))",
                        left: signed ? "50%" : "0",
                        width: "0%",
                        opacity: 0.35,
                      }}
                    />
                  </div>
                  <span
                    ref={el => { valRefs.current[key] = el; }}
                    className="w-14 shrink-0 text-right font-mono text-[11px] tabular-nums text-[rgb(var(--color-text-muted))]"
                  >0</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[rgb(var(--color-border))] p-4">
            <h2 className="mb-2 text-[11px] uppercase tracking-[0.12em] text-[rgb(var(--color-text-muted))]">
              按下的键
            </h2>
            <div className="min-h-[26px] text-sm">
              {pressed.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {pressed.map(p => (
                    <span key={p}
                      className="rounded-md border border-[rgb(var(--color-accent))] px-2 py-0.5 text-[11px] text-[rgb(var(--color-accent))]">
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[rgb(var(--color-text-muted))]">无</span>
              )}
            </div>
          </div>

          <div ref={rawRef}
            className="break-all rounded-lg bg-[rgb(var(--color-bg-soft))] px-3 py-2 font-mono text-[10px] leading-relaxed text-[rgb(var(--color-text-muted))]">
            —
          </div>
        </div>
      </div>

      {/* 映射表 */}
      <section className="mt-10">
        <h2 className="mb-1 text-lg font-semibold">六足机器人摇杆映射</h2>
        <p className="mb-4 text-sm text-[rgb(var(--color-text-muted))]">
          这套分配是给 18 自由度六足定的，左手管平移、右手管姿态，上手不用重新学。
        </p>
        <div className="overflow-hidden rounded-xl border border-[rgb(var(--color-border))]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[rgb(var(--color-bg-soft))] text-left text-[11px] uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
                <th className="px-4 py-2.5 font-medium">按键</th>
                <th className="px-4 py-2.5 font-medium">作用</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--color-border))]">
              {[
                ["左摇杆 Y", "前后平移", "向上=前进"],
                ["左摇杆 X", "左右横移", "不用转身就能侧着走"],
                ["右摇杆 X", "原地转向", "绕机体中心旋转"],
                ["右摇杆 Y", "身体升降", "过矮障碍时抬高机体"],
                ["十字键 ↑↓", "速度 ±", "每格 3/255"],
                ["LT / RT", "速度微调", "模拟量，按得越深越快"],
                ["LB / RB", "换步态", "三角 ⇄ 波纹"],
                ["A", "急停", "松开自动恢复，按住不放就一直站着"],
                ["Back", "高度回中", "身体高度归零"],
              ].map(([k, v, note]) => (
                <tr key={k}>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[12px] text-[rgb(var(--color-accent))]">{k}</td>
                  <td className="px-4 py-2.5">{v}</td>
                  <td className="hidden px-4 py-2.5 text-[rgb(var(--color-text-muted))] sm:table-cell">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 技术说明 */}
      <section className="mt-10 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface)/var(--color-surface-alpha))] p-5">
        <h2 className="mb-2 text-sm font-semibold">这个页面怎么读到手柄的</h2>
        <p className="text-[13px] leading-relaxed text-[rgb(var(--color-text-muted))]">
          W3C Gamepad API，浏览器原生能力，<b className="text-[rgb(var(--color-text))]">不需要驱动、不需要插件</b>。
          Windows 下 XInput 手柄（包括伪装成 Xbox 360 的第三方手柄）会被直接识别成标准 Gamepad，
          用 <code className="rounded bg-[rgb(var(--color-bg-soft))] px-1 py-0.5 font-mono text-[11px]">navigator.getGamepads()</code>
          每帧轮询即可。轴值范围 −1 ~ +1，扳机 0 ~ 1。
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-[rgb(var(--color-text-muted))]">
          注意浏览器有一条安全限制：页面加载后必须<b className="text-[rgb(var(--color-text))]">先按一下手柄</b>，
          设备才会出现在列表里 —— 不是手柄坏了。
        </p>
      </section>
    </div>
  );
}
