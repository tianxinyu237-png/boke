"use client";

import { useEffect } from "react";

export function useMermaid(containerId: string) {
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const mermaidBlocks = container.querySelectorAll("pre.mermaid");
    if (mermaidBlocks.length === 0) return;

    // Dynamically load mermaid
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
    script.onload = async () => {
      const mermaid = (window as any).mermaid;
      
      if (!mermaid) return;
      
      mermaid.initialize({ startOnLoad: false, theme: document.documentElement.classList.contains("light") ? "default" : "dark" });
      
      for (const block of mermaidBlocks) {
        try {
          const code = block.textContent || "";
          const id = "mermaid-" + Math.random().toString(36).slice(2, 8);
          const { svg } = await mermaid.render(id, code);
          block.innerHTML = svg;
          block.classList.add("mermaid-rendered");
        } catch (e) {
          block.innerHTML = '<p class="text-red-400 text-xs">Mermaid 渲染失败</p>';
        }
      }
    };
    document.head.appendChild(script);
  }, [containerId]);
}
