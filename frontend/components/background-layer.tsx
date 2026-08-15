"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { loadBgConfig, saveBgConfig, loadBgConfigHybrid, type BackgroundConfig } from "@/lib/background";

// 全局遮罩渐变 —— 与背景图合并进 body 的同一个 background 栈 (单图层)
const VEIL_GRADIENT =
  "linear-gradient(180deg, rgba(10,10,22,0.84) 0%, rgba(10,10,22,0.74) 40%, rgba(10,10,22,0.80) 100%)";

export default function BackgroundLayer() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isHome = pathname === "/";
  const [config, setConfig] = useState<BackgroundConfig | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadBgConfigHybrid().then((cfg) => {
      setConfig(cfg);
    });
  }, []);

  useEffect(() => {
    loadBgConfigHybrid().then((cfg) => {
      setConfig(cfg);
    });
  }, [pathname]);

  useEffect(() => {
    const handler = () => {
      loadBgConfigHybrid().then((cfg) => {
        setConfig(cfg);
      });
    };
    window.addEventListener("bg-config-change", handler);
    return () => window.removeEventListener("bg-config-change", handler);
  }, []);

  // Toggle has-custom-bg class on body to make background visible
  useEffect(() => {
    if (!config) return;
    const hasBg = (config.enabled && config.url) || (config.welcomeEnabled && config.welcomeUrl && isHome);
    if (hasBg) {
      document.body.classList.add("has-custom-bg");
    } else {
      document.body.classList.remove("has-custom-bg");
    }
    return () => {
      document.body.classList.remove("has-custom-bg");
    };
  }, [config, isHome]);

  // ═══ 2026-08-14 核心改动: 背景直接应用在 body 上 (单 background 栈) ═══
  // 原实现用两个全屏 fixed 图层(图片层 z-0 + 遮罩层 z-1),Chrome 合成器会对
  // 页面内容层降采样栅格化,导致整页文字发虚(GPU 实测边缘能量 1.88 vs body 单栈 12.64)。
  // 把遮罩渐变和背景图合并进 body 的 background 栈 → 零额外合成图层 → 全分辨率渲染。
  function resetBodyBg() {
    document.body.style.backgroundColor = "";
    document.body.style.backgroundImage = "";
    document.body.style.backgroundSize = "";
    document.body.style.backgroundPosition = "";
    document.body.style.backgroundRepeat = "";
  }

  useEffect(() => {
    if (isAdmin) {
      resetBodyBg();
      return;
    }
    if (!config) return;

    let activeUrl = "";
    let activeType: "image" | "video" = "image";
    // 主页背景统一使用全站背景设置; 欢迎壁纸仅用于欢迎浮层(WelcomeOverlay), 不覆盖主页
    if (config.enabled && config.url) {
      activeUrl = config.url;
      activeType = config.type;
    }

    if (!activeUrl) {
      resetBodyBg();
      return;
    }

    // 移动端开关: 关闭移动端背景时不应用
    if (activeType === "image" && !config.enableMobile && window.innerWidth < 768) {
      resetBodyBg();
      return;
    }

    // 视频类型继续走组件渲染分支 (下方 return null 之外由 video 元素处理)
    if (activeType === "video") return;

    // 图片: 预加载完成后应用 (配合 layout.tsx head 里的 <link rel=preload>,
    // 首绘时即可就绪; 慢网下就绪后一次性应用, 无图层弹出、无降采样)
    const img = new Image();
    let cancelled = false;
    img.onload = () => {
      if (cancelled) return;
      document.body.style.backgroundColor = "rgb(27, 27, 34)";
      document.body.style.backgroundImage = `${VEIL_GRADIENT}, url(${activeUrl})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundRepeat = "no-repeat";
    };
    img.onerror = () => {
      if (!cancelled) resetBodyBg();
    };
    img.src = activeUrl;

    return () => {
      cancelled = true;
    };
  }, [config, isHome, isAdmin]);

  // 视频分支(当前配置为 image,保留原实现备用)
  if (isAdmin || !config) return null;

  let videoUrl = "";
  let videoType: "image" | "video" = "image";
  if (config.enabled && config.url) {
    videoUrl = config.url;
    videoType = config.type;
  }
  if (videoType !== "video" || !videoUrl) return null;
  if (!config.enableMobile && typeof window !== "undefined" && window.innerWidth < 768) return null;

  return (
    <>
      <video
        ref={videoRef}
        key={videoUrl}
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
          objectFit: "cover",
          opacity: config.opacity,
          filter: config.blur > 0 ? `blur(${config.blur}px)` : undefined,
        }}
        onError={(e) => {
          (e.currentTarget as HTMLVideoElement).style.display = "none";
        }}
        onLoadedData={() => {
          videoRef.current?.play().catch(() => {});
        }}
      />
      {/* Dark overlay to keep content readable */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          pointerEvents: "none",
          background: VEIL_GRADIENT,
        }}
      />
    </>
  );
}
