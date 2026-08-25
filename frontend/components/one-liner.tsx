"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { loadOneLinerConfig, type OneLinerConfig, DEFAULT_ONE_LINER } from "@/lib/oneliner";

// 右下角"一言"挂件:随机文案,点击换一句,× 关闭本次会话
export default function OneLiner() {
  const [cfg, setCfg] = useState<OneLinerConfig>(DEFAULT_ONE_LINER);
  const [idx, setIdx] = useState(-1); // -1 = 未初始化
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    loadOneLinerConfig().then((c) => {
      setCfg(c);
      setIdx(Math.floor(Math.random() * c.lines.length));
    });
    // 本会话关闭过就不再显示
    if (sessionStorage.getItem("oneliner_hidden")) setHidden(true);
  }, []);

  const next = useCallback(() => {
    if (!cfg.lines.length) return;
    setIdx((i) => (i + 1) % cfg.lines.length);
  }, [cfg.lines.length]);

  const close = () => {
    sessionStorage.setItem("oneliner_hidden", "1");
    setHidden(true);
  };

  if (hidden || idx < 0) return null;
  const line = cfg.lines[idx];

  return (
    <div className="fixed bottom-5 right-5 z-[90] max-w-[230px]">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card border-border/60 rounded-2xl px-4 py-3 shadow-lg"
      >
        <button
          onClick={close}
          aria-label="关闭"
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-bg-mute border border-border text-text-muted hover:text-red-400 hover:border-red-400/40 text-[10px] flex items-center justify-center transition-colors"
        >
          ✕
        </button>
        <button onClick={next} className="block w-full text-left group">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-accent text-[11px]">✨ 一言</span>
            <span className="text-[9px] text-text-muted group-hover:text-accent transition-colors">点我换一句</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-xs text-text-secondary leading-relaxed"
            >
              {line}
            </motion.p>
          </AnimatePresence>
        </button>
      </motion.div>
    </div>
  );
}
