"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { loadLinksConfig, type LinksConfig, DEFAULT_LINKS } from "@/lib/links";

export default function LinksContent() {
  const reduce = useReducedMotion();
  const [links, setLinks] = useState<LinksConfig>(DEFAULT_LINKS);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    loadLinksConfig().then(setLinks);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-12 pb-24">
      <motion.div
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
          友链
        </h1>
        <p className="text-text-muted text-sm mb-10">
          常去的技术博客和朋友们的小站
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.friends.map((friend, i) => (
          <motion.a
            key={friend.url}
            href={friend.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={reduce ? {} : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="glass-card group flex items-center gap-4 px-4 py-3.5 hover:border-accent/40"
          >
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold shrink-0 ring-1 ring-accent/20">
              {friend.avatar ? (
                <img src={friend.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                friend.name[0]
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                {friend.name}
              </div>
              <div className="text-xs text-text-muted truncate">{friend.desc}</div>
            </div>
          </motion.a>
        ))}
      </div>

      {/* Exchange info */}
      <div className="mt-16 pt-8 border-t border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">友链交换</h2>
        <div className="bg-bg-soft border border-border rounded-xl p-5 text-sm text-text-secondary space-y-2">
          <p>欢迎交换友链！请先在您的博客添加本站链接，然后：</p>
          <div className="bg-bg border border-border rounded-lg p-3 font-mono text-xs text-text-muted">
            <div>名称：{links.exchangeName}</div>
            <div>地址：{origin}</div>
            <div>描述：{links.exchangeDesc}</div>
          </div>
          <p className="text-text-muted text-xs">
            添加后可通过评论区或 GitHub Issue 通知我。
          </p>
        </div>
      </div>
    </div>
  );
}
