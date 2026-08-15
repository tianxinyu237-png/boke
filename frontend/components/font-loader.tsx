"use client";

import { useEffect } from "react";
import { loadFontConfig, FONT_GOOGLE_MAP } from "@/lib/fonts";

/**
 * Dynamically loads the selected Google Font and applies it via CSS custom property.
 */
export default function FontLoader() {
  useEffect(() => {
    const config = loadFontConfig();
    if (config.sans === "inter") return; // default, already loaded

    const font = FONT_GOOGLE_MAP[config.sans];
    if (!font) return;

    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${font.family}:wght@300;400;500;600;700&display=swap`;
    link.rel = "stylesheet";
    link.id = "devlog-dynamic-font";
    document.head.appendChild(link);

    // Apply to root
    document.documentElement.style.setProperty(font.cssVar, `"${font.family.replace(/\+/g, " ")}", sans-serif`);

    return () => {
      link.remove();
    };
  }, []);

  return null;
}
