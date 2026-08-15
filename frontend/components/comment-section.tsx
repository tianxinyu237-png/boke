"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/theme-toggle";
import { useSiteConfig } from "@/components/site-config-provider";

/**
 * Giscus comment widget.
 * Prerequisites:
 *   1. GitHub repo must be public
 *   2. Install Giscus app: https://github.com/apps/giscus
 *   3. Enable Discussions in repo Settings
 *   4. Update GISCUS_CONFIG below with your repo name
 */
// Giscus config from site settings
function useGiscusConfig() {
  const { config } = useSiteConfig();
  return {
    repo: config.giscusRepo || "",
    repoId: config.giscusRepoId || "",
    category: config.giscusCategory || "Announcements",
    categoryId: config.giscusCategoryId || "",
    mapping: "pathname" as const,
    reactionsEnabled: "1" as const,
    emitMetadata: "0" as const,
    inputPosition: "bottom" as const,
    lang: "zh-CN",
    loading: "lazy" as const,
  };
}

export default function CommentSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const GISCUS_CONFIG = useGiscusConfig();

  useEffect(() => {
    if (!GISCUS_CONFIG.repo || !GISCUS_CONFIG.repoId) return;
    const container = containerRef.current;
    if (!container) return;

    // Check if already loaded (prevent duplicates on theme change)
    const existing = container.querySelector("iframe");
    if (existing) {
      // Send theme update to existing iframe
      const giscusTheme = theme === "dark" ? "dark" : "light";
      existing.contentWindow?.postMessage(
        { giscus: { setConfig: { theme: giscusTheme } } },
        "https://giscus.app"
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", GISCUS_CONFIG.repo);
    script.setAttribute("data-repo-id", GISCUS_CONFIG.repoId);
    script.setAttribute("data-category", GISCUS_CONFIG.category);
    script.setAttribute("data-category-id", GISCUS_CONFIG.categoryId);
    script.setAttribute("data-mapping", GISCUS_CONFIG.mapping);
    script.setAttribute("data-reactions-enabled", GISCUS_CONFIG.reactionsEnabled);
    script.setAttribute("data-emit-metadata", GISCUS_CONFIG.emitMetadata);
    script.setAttribute("data-input-position", GISCUS_CONFIG.inputPosition);
    script.setAttribute("data-lang", GISCUS_CONFIG.lang);
    script.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
    script.setAttribute("data-loading", GISCUS_CONFIG.loading);
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;

    container.appendChild(script);
  }, [theme]);

  return (
    <div className="mt-16 pt-8 border-t border-border">
      <h2 className="text-lg font-semibold text-text-primary mb-6">评论</h2>
      {GISCUS_CONFIG.repo ? (
      <div ref={containerRef} className="giscus" />
    ) : (
      <p className="text-text-muted text-sm">评论功能未配置 — 请在管理后台「站点设置」中填写 Giscus 信息</p>
    )}
    </div>
  );
}
