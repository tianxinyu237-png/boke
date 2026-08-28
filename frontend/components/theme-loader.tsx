"use client";

import { useEffect } from "react";
import { loadThemeConfig, applyTheme, type ThemeColors, DEFAULT_THEME } from "@/lib/theme";

export default function ThemeLoader({ initialTheme }: { initialTheme?: ThemeColors }) {
  useEffect(() => {
    let currentTheme = initialTheme || DEFAULT_THEME;
    const isLight = () => document.documentElement.classList.contains("light");

    // SSR 已注入首帧主题, 挂载即应用(值相同, 无视觉闪变), fetch 仅作后台配置变更兜底
    applyTheme(currentTheme, isLight());

    const observer = new MutationObserver(() => applyTheme(currentTheme, isLight()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    loadThemeConfig().then((theme) => {
      currentTheme = theme;
      applyTheme(currentTheme, isLight());
    });

    return () => observer.disconnect();
  }, [initialTheme]);

  return null;
}
