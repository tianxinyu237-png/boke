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

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE);

  useEffect(() => {
    loadSiteConfigHybrid().then(setConfig);
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
