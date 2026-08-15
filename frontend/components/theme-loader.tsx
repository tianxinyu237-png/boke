"use client";

import { useEffect } from "react";
import { loadThemeConfig, applyTheme } from "@/lib/theme";

export default function ThemeLoader() {
  useEffect(() => {
    loadThemeConfig().then((theme) => {
      // Determine current mode
      const isLight = document.documentElement.classList.contains("light");
      applyTheme(theme, isLight);

      // Listen for theme changes
      const observer = new MutationObserver(() => {
        const light = document.documentElement.classList.contains("light");
        applyTheme(theme, light);
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      return () => observer.disconnect();
    });
  }, []);

  return null;
}
