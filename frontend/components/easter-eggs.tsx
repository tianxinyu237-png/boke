"use client";

import { useEffect } from "react";

// Konami 秘籍序列:↑ ↑ ↓ ↓ ← → ← → B A
const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

const CONFETTI_COLORS = ["#c084fc", "#0ea5e9", "#22d3ee", "#f093fb", "#34d399", "#fbbf24", "#f87171", "#ffffff"];

function triggerKonami() {
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden;";
  document.body.appendChild(overlay);

  if (!document.getElementById("konami-style")) {
    const style = document.createElement("style");
    style.id = "konami-style";
    style.textContent = `
      @keyframes konami-fall { to { transform: translateY(110vh) rotate(720deg); opacity: 0; } }
      @keyframes konami-flash { 0%,100% { opacity: 0; } 10%,90% { opacity: 1; } }
    `;
    document.head.appendChild(style);
  }

  // 全屏短暂闪光
  const flash = document.createElement("div");
  flash.style.cssText =
    "position:fixed;inset:0;background:linear-gradient(135deg,#c084fc33,#0ea5e933);animation:konami-flash 0.8s ease-out;";
  overlay.appendChild(flash);

  // 彩带雨
  for (let i = 0; i < 90; i++) {
    const p = document.createElement("div");
    const size = 5 + Math.random() * 11;
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    p.style.cssText = `
      position:absolute;left:${Math.random() * 100}%;top:-24px;
      width:${size}px;height:${size * 0.45}px;border-radius:2px;
      background:${color};opacity:0.95;
      animation:konami-fall ${1.4 + Math.random() * 2.2}s linear ${Math.random() * 0.8}s forwards;
    `;
    overlay.appendChild(p);
  }

  // 提示文字
  const tip = document.createElement("div");
  tip.style.cssText =
    "position:fixed;left:50%;top:38%;transform:translateX(-50%);color:#fff;font-size:18px;font-weight:700;letter-spacing:2px;text-shadow:0 2px 12px rgba(0,0,0,.5);animation:konami-flash 2.5s ease-out;z-index:9999;";
  tip.textContent = "🎮 秘籍生效!你是个老玩家";
  overlay.appendChild(tip);

  setTimeout(() => overlay.remove(), 7000);
}

export default function EasterEggs() {
  useEffect(() => {
    // 控制台彩蛋
    console.log(
      "%c👋 嗨,你是个好奇的人!",
      "color:#c084fc;font-size:20px;font-weight:bold;"
    );
    console.log(
      "%c想一起写代码吗?→ github.com/tianxinyu237-png",
      "color:#0ea5e9;font-size:13px;"
    );
    console.log(
      "%c顺便:按 ↑↑↓↓←→←→BA 有惊喜",
      "color:#22d3ee;font-size:12px;"
    );

    // Konami 监听
    let idx = 0;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === KONAMI[idx]) {
        idx++;
        if (idx === KONAMI.length) {
          idx = 0;
          triggerKonami();
        }
      } else {
        idx = key === KONAMI[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
