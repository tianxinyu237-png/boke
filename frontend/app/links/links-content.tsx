"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { loadLinksConfig, type LinksConfig, DEFAULT_LINKS } from "@/lib/links";

/* ── 友链页 ──
   参考 blog.liveout.cn/friends 的做法：不用卡片！
   每条友链就是一个「方角头像 + 名字 + 一句描述」的三列网格，
   没有边框、没有圆角、没有背景色 —— 靠留白和字距撑住版面。
   （liveout 实测：卡 356×132，头像 52×52 方角，名字 15.5px/600，
     描述 12.3px，3 列 gap 16px，页面大标题 48px） */
export default function LinksContent() {
  const reduce = useReducedMotion();
  const [links, setLinks] = useState<LinksConfig>(DEFAULT_LINKS);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    loadLinksConfig().then(setLinks);
  }, []);

  return (
    <div className="mx-auto max-w-[1024px] px-5 pt-12 pb-24 sm:px-8">
      {/* ── 页头 ── */}
      <motion.header
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-text-muted">
          Friends / Links
        </p>
        <h1 className="mt-3 font-wenkai text-[clamp(30px,4.8vw,46px)] leading-[1.12] tracking-[-0.02em] text-text-primary">
          {links.pageTitle || "友链"}
        </h1>
        <p className="mt-3 text-[13px] text-text-muted">
          {links.pageSubtitle}
          {links.pageSubtitle ? " · " : ""}共 {links.friends.length} 个
        </p>
      </motion.header>

      {links.friends.length === 0 ? (
        <p className="mt-12 text-[13px] text-text-muted">
          还没有添加友链。到后台「内容管理 → 🔗友链」添加即可。
        </p>
      ) : null}

      {/* ── 友链网格：无卡片，方角头像 ── */}
      <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
        {links.friends.map((friend, i) => (
          <motion.a
            key={friend.url}
            href={friend.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={reduce ? {} : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="group flex items-start gap-3.5"
          >
            {/* 52×52 方角头像（不是圆形） */}
            <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden bg-bg-mute/70 text-[15px] font-semibold text-text-muted ring-1 ring-border/60 transition-colors group-hover:ring-accent/40">
              {friend.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={friend.avatar}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                friend.name.slice(0, 1)
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold leading-snug text-text-primary transition-colors group-hover:text-accent">
                {friend.name}
              </span>
              {friend.desc ? (
                <span className="mt-1 block line-clamp-2 text-[12px] leading-relaxed text-text-muted">
                  {friend.desc}
                </span>
              ) : null}
              <span className="mt-1.5 block truncate font-mono text-[10px] text-text-muted/60">
                {friend.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </span>
            </span>
          </motion.a>
        ))}
      </div>

      {/* ── 友链交换（保留原有功能）── */}
      <div className="mt-20 border-t border-border pt-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-text-muted">
          Exchange
        </p>
        <h2 className="mt-1.5 font-wenkai text-[24px] leading-tight text-text-primary">
          友链交换
        </h2>

        <div className="mt-5 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="text-[13px] leading-relaxed text-text-secondary">
            <p>以下为本站信息，欢迎复制：</p>
            {links.exchangeAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={links.exchangeAvatar}
                alt=""
                className="mb-4 h-12 w-12 rounded object-cover ring-1 ring-border/60"
              />
            ) : null}
            <dl className="mt-4 space-y-1.5 font-mono text-[11.5px] text-text-muted">
              <div className="flex gap-3">
                <dt className="w-9 shrink-0 opacity-60">名称</dt>
                <dd className="text-text-secondary">{links.exchangeName}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-9 shrink-0 opacity-60">地址</dt>
                <dd className="break-all text-text-secondary">{links.exchangeUrl || origin || "…"}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-9 shrink-0 opacity-60">描述</dt>
                <dd className="text-text-secondary">{links.exchangeDesc}</dd>
              </div>
            </dl>
            {links.exchangeNote ? (
              <p className="mt-4 text-[12px] leading-relaxed text-text-muted">
                {links.exchangeNote}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
