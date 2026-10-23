"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  loadConfig,
  saveConfig,
  loadParticleConfigFromServer,
  type ParticleConfig,
} from "@/lib/particles";

const STORAGE_KEY = "devlog-particle-config";

function buildCfg(config: ParticleConfig) {
  return {
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
}

function destroyParticles() {
  const d = (window as any).__HALO_FLOATING_PARTICLES_DESTROY__;
  if (d && typeof d === "function") d();
  const c = document.getElementById("halo-floating-particles-canvas");
  if (c) c.remove();
  const old = document.querySelector('script[data-halo-fp="true"]');
  if (old) old.remove();
}

export default function FloatingParticles() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Inject the particle script with the latest config (no-op when disabled)
  const injectScript = useCallback(() => {
    const config = loadConfig();
    if (!config.enabled) return;
    (window as any).__HALO_FLOATING_PARTICLES__ = buildCfg(config);
    destroyParticles();
    const s = document.createElement("script");
    s.src = `/particles/floating-particles.js?v=${Date.now()}`;
    s.dataset.haloFp = "true";
    document.head.appendChild(s);
    scriptRef.current = s;
  }, []);

  // Initial load / path change
  useEffect(() => {
    if (isAdmin) return;
    injectScript();
    return () => destroyParticles();
  }, [isAdmin, pathname, injectScript]);

  // Same-tab config changes from admin panel
  useEffect(() => {
    const handler = () => injectScript();
    window.addEventListener("particle-config-change", handler);
    return () => window.removeEventListener("particle-config-change", handler);
  }, [injectScript]);

  // Cross-tab sync: another tab saved config to localStorage
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      injectScript();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [injectScript]);

  // Cross-device sync: pull config from server, override local cache if different
  useEffect(() => {
    if (isAdmin) return;
    let cancelled = false;
    loadParticleConfigFromServer().then((remote) => {
      if (cancelled || !remote) return;
      const local = loadConfig();
      if (JSON.stringify(remote) !== JSON.stringify(local)) {
        saveConfig(remote);
        injectScript();
      }
    });
    return () => { cancelled = true; };
  }, [isAdmin, injectScript]);

  return null;
}
