"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

function NotFoundCat() {
  return (
    <div className="relative inline-block w-28 h-28">
      {/* 尾巴 */}
      <svg className="absolute -right-6 top-4 w-10 h-10" viewBox="0 0 40 40" fill="none">
        <path
          d="M36 6c-8 2-16 8-14 16 1 4-3 8-8 10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-text-muted origin-bottom-left animate-[cat-tail_2s_ease-in-out_infinite]"
          style={{ animation: "cat-tail 2s ease-in-out infinite" }}
        />
      </svg>
      <style>{`
        @keyframes cat-tail { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(28deg); } }
        @keyframes cat-head { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-4deg); } 75% { transform: rotate(4deg); } }
      `}</style>
      {/* 头 */}
      <svg
        viewBox="0 0 120 110"
        className="w-full h-full text-accent animate-[cat-head_3s_ease-in-out_infinite]"
        style={{ animation: "cat-head 3s ease-in-out infinite" }}
      >
        {/* 耳朵 */}
        <path d="M28 42 L20 10 L48 28 Z" fill="currentColor" opacity="0.9" />
        <path d="M92 42 L100 10 L72 28 Z" fill="currentColor" opacity="0.9" />
        {/* 内耳 */}
        <path d="M29 38 L24 16 L43 29 Z" fill="#f9a8d4" opacity="0.6" />
        <path d="M91 38 L96 16 L77 29 Z" fill="#f9a8d4" opacity="0.6" />
        {/* 脸 */}
        <ellipse cx="60" cy="64" rx="48" ry="42" fill="currentColor" opacity="0.15" />
        <ellipse cx="60" cy="64" rx="42" ry="37" fill="currentColor" opacity="0.25" />
        {/* 眼睛 */}
        <circle cx="44" cy="60" r="6" fill="#fff" />
        <circle cx="76" cy="60" r="6" fill="#fff" />
        <circle cx="46" cy="60" r="3" fill="#0f172a" />
        <circle cx="78" cy="60" r="3" fill="#0f172a" />
        {/* 嘴 */}
        <path d="M60 68 q-6 6 -12 2 M60 68 q6 6 12 2" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M60 74 v-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        {/* 胡须 */}
        <path d="M20 62 h16 M22 70 h14 M100 62 h-16 M98 70 h-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        {/* 腮红 */}
        <circle cx="30" cy="72" r="5" fill="#f9a8d4" opacity="0.4" />
        <circle cx="90" cy="72" r="5" fill="#f9a8d4" opacity="0.4" />
      </svg>
    </div>
  );
}

export default function NotFound() {
  const reduce = useReducedMotion();
  const [rolling, setRolling] = useState(false);

  async function goRandom() {
    setRolling(true);
    try {
      const res = await fetch("/api/posts?page=0&size=50", { cache: "no-store" });
      const data = await res.json();
      const posts = data?.posts ?? [];
      if (posts.length) {
        const pick = posts[Math.floor(Math.random() * posts.length)];
        window.location.href = "/posts/" + pick.slug;
        return;
      }
    } catch {}
    // 没有文章就回首页
    window.location.href = "/";
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-24 text-center">
      <motion.div
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="text-7xl sm:text-8xl font-bold tracking-tight mb-6 bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--hero-from) 0%, var(--hero-via) 50%, var(--hero-to) 100%)",
          }}
        >
          404
        </div>

        <div className="mb-6 flex justify-center">
          <NotFoundCat />
        </div>

        <h1 className="text-text-primary text-xl font-semibold mb-2">
          这个页面被外星人带走了 🛸
        </h1>
        <p className="text-text-secondary mb-8 text-sm">
          可能是地址拼错了,也可能是它真的不在这里。
          <br className="hidden sm:block" />
          别慌,猫咪已经在找它了(尾巴摇得正欢)。
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={goRandom}
            disabled={rolling}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm disabled:opacity-60"
          >
            {rolling ? "🎲 翻牌中…" : "🎲 随机去一篇文章"}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-bg-soft text-text-secondary hover:text-accent border border-border transition-colors text-sm"
          >
            ← 回首页
          </Link>
        </div>

        <p className="mt-10 text-[11px] text-text-muted">
          按 ↑↑↓↓←→←→BA 也许能召唤出什么……
        </p>
      </motion.div>
    </div>
  );
}
