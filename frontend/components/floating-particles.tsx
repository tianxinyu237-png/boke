"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { loadConfig, DEFAULT_CONFIG, type ParticleConfig } from "@/lib/particles";

export default function FloatingParticles() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const loadedRef = useRef(false);

  // Load config from localStorage and inject particle script (client-only)
  useEffect(() => {
    if (isAdmin) return;
    const config = loadConfig();
    if (!config.enabled) return;

    const cfg = {
      enabled: config.enabled, effect: config.effect, cursorEffect: config.cursorEffect,
      count: config.count, color: config.color, opacity: config.opacity, speed: config.speed,
      enableMobile: config.enableMobile, pageMode: config.pageMode,
      includePaths: config.includePaths ? config.includePaths.split("\n").filter(Boolean) : [],
      excludePaths: config.excludePaths ? config.excludePaths.split("\n").filter(Boolean) : [],
      cursorStyleEnabled: config.cursorStyleEnabled,
      cursorStyleTemplate: config.cursorStyleTemplate,
      cursorStyleImage: config.cursorStyleImage,
      zIndex: config.zIndex,
    };

    (window as any).__HALO_FLOATING_PARTICLES__ = cfg;

    // Remove old script
    const old = document.querySelector('script[data-halo-fp="true"]');
    if (old) old.remove();

    // Inject script
    const s = document.createElement("script");
    s.src = `/particles/floating-particles.js?v=${Date.now()}`;
    s.dataset.haloFp = "true";
    document.head.appendChild(s);
    scriptRef.current = s;
    loadedRef.current = true;

    return () => {
      const d = (window as any).__HALO_FLOATING_PARTICLES_DESTROY__;
      if (d && typeof d === "function") d();
      const c = document.getElementById("halo-floating-particles-canvas");
      if (c) c.remove();
      if (scriptRef.current) scriptRef.current.remove();
    };
  }, [isAdmin, pathname]);

  // Always listen for config changes from admin panel
  useEffect(() => {
    const handler = () => {
      const config = loadConfig();
      if (!config.enabled) return;
      // Destroy
      const d = (window as any).__HALO_FLOATING_PARTICLES_DESTROY__;
      if (d && typeof d === "function") d();
      const c = document.getElementById("halo-floating-particles-canvas");
      if (c) c.remove();
      const old = document.querySelector('script[data-halo-fp="true"]');
      if (old) old.remove();

      const cfg = {
        enabled: config.enabled, effect: config.effect, cursorEffect: config.cursorEffect,
        count: config.count, color: config.color, opacity: config.opacity, speed: config.speed,
        enableMobile: config.enableMobile, pageMode: config.pageMode,
        includePaths: config.includePaths ? config.includePaths.split("\n").filter(Boolean) : [],
        excludePaths: config.excludePaths ? config.excludePaths.split("\n").filter(Boolean) : [],
        cursorStyleEnabled: config.cursorStyleEnabled,
        cursorStyleTemplate: config.cursorStyleTemplate,
        cursorStyleImage: config.cursorStyleImage,
        zIndex: config.zIndex,
      };

      (window as any).__HALO_FLOATING_PARTICLES__ = cfg;
      const s = document.createElement("script");
      s.src = `/particles/floating-particles.js?v=${Date.now()}`;
      s.dataset.haloFp = "true";
      document.head.appendChild(s);
    };
    window.addEventListener("particle-config-change", handler);
    return () => window.removeEventListener("particle-config-change", handler);
  }, []);

  return null;
}
