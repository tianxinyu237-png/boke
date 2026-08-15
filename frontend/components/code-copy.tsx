"use client";

import { useEffect } from "react";

export function useCodeCopy(containerId: string) {
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const pres = container.querySelectorAll("pre");
    pres.forEach((pre) => {
      // Skip if already has copy button
      if (pre.querySelector(".code-copy-btn")) return;

      // Wrap pre in relative container
      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper relative group";
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      // Create copy button
      const btn = document.createElement("button");
      btn.className =
        "code-copy-btn absolute top-2 right-2 z-10 px-2 py-1 rounded text-xs font-medium bg-bg-soft border border-border text-text-muted opacity-0 group-hover:opacity-100 hover:text-accent hover:border-accent/30 transition-all";
      btn.textContent = "复制";
      btn.onclick = async () => {
        const code = pre.querySelector("code")?.textContent || pre.textContent || "";
        try {
          await navigator.clipboard.writeText(code);
          btn.textContent = "已复制!";
          setTimeout(() => (btn.textContent = "复制"), 2000);
        } catch {
          // Fallback
          const ta = document.createElement("textarea");
          ta.value = code;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          btn.textContent = "已复制!";
          setTimeout(() => (btn.textContent = "复制"), 2000);
        }
      };
      wrapper.appendChild(btn);
    });
  }, [containerId]);
}
