"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useSiteConfig } from "@/components/site-config-provider";
import { loadBgConfigHybrid, type BackgroundConfig } from "@/lib/background";

export default function WelcomeOverlay() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [bgConfig, setBgConfig] = useState<BackgroundConfig | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { config: SITE } = useSiteConfig();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    let cancelled = false;
    // 优先读服务器配置(server-first hybrid),以 welcomeEnabled 为欢迎层总开关
    loadBgConfigHybrid().then((cfg) => {
      if (cancelled) return;
      setBgConfig(cfg);
      // 欢迎层关闭时不显示 —— 避免每次打开博客都闪烁(2026-08-14)
      if (!cfg.welcomeEnabled) return;
      const welcomed = sessionStorage.getItem("devlog-welcomed");
      if (!welcomed) {
        setVisible(true);
        document.documentElement.style.overflow = "hidden";
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem("devlog-welcomed", "1");
    document.documentElement.style.overflow = "";
  }

  const hasWelcomeBg = bgConfig?.welcomeEnabled && bgConfig?.welcomeUrl;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Welcome background */}
          {hasWelcomeBg && bgConfig && (
            bgConfig.welcomeType === "video" ? (
              <video
                ref={videoRef}
                src={bgConfig.welcomeUrl}
                autoPlay muted loop playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${bgConfig.welcomeUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            )
          )}

          {/* Dark overlay for text readability */}
          <div
            className="absolute inset-0"
            style={{ background: "rgb(0 0 0 / 0.45)" }}
          />

          {/* Content */}
          <div className="relative z-10 text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Avatar */}
              <motion.div
                className="inline-block mb-8"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.7, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              >
                {SITE.avatarUrl ? (
                  <img
                    src={SITE.avatarUrl}
                    alt=""
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-white/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white/30">
                    {SITE.avatar}
                  </div>
                )}
              </motion.div>

              <motion.p
                className="text-white/80 text-lg mb-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                {greetingByHour()},陌生人
              </motion.p>

              <motion.h1
                className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.7 }}
              >
                {SITE.name}
              </motion.h1>

              <motion.p
                className="text-white/60 text-sm mb-8 max-w-xs mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.6 }}
              >
                {SITE.description}
              </motion.p>

              <motion.button
                onClick={dismiss}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors text-sm backdrop-blur"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.5 }}
              >
                进入博客
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 按时间段问候
function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 5) return "夜深了,还不睡";
  if (h < 9) return "早上好";
  if (h < 12) return "上午好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  if (h < 23) return "晚上好";
  return "夜深了,还不睡";
}
