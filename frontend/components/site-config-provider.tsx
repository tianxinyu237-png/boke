"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadSiteConfig, saveSiteConfig, loadSiteConfigHybrid, saveSiteConfigToServer, type SiteConfig, DEFAULT_SITE } from "@/lib/site-config";

interface SiteConfigContextType {
  config: SiteConfig;
  update: (patch: Partial<SiteConfig>) => void;
}

const SiteConfigContext = createContext<SiteConfigContextType>({
  config: DEFAULT_SITE,
  update: () => {},
});

export function SiteConfigProvider({ children, initialConfig }: { children: ReactNode; initialConfig?: SiteConfig }) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig || DEFAULT_SITE);

  useEffect(() => {
    // SSR 已注入初始配置, 此处仅兜底刷新(后台改配置后已有会话也能同步), 值相同不触发重渲染
    loadSiteConfigHybrid().then((c) => {
      setConfig((prev) => (JSON.stringify(prev) === JSON.stringify(c) ? prev : c));
    });
  }, []);

  const update = (patch: Partial<SiteConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    saveSiteConfig(next);
    saveSiteConfigToServer(next);
    window.dispatchEvent(new CustomEvent("site-config-change"));
  };

  return (
    <SiteConfigContext.Provider value={{ config, update }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
