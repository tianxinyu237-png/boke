"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSiteConfig } from "@/components/site-config-provider";

export default function Live2DWidget() {
  const initRef = useRef(false);
  const pathname = usePathname();
  const { config: site } = useSiteConfig();

  useEffect(() => {
    // 后台页面不加载看板娘
    if (pathname.startsWith("/admin")) return;
    if (initRef.current) return;
    initRef.current = true;

    function tryInit() {
      // @ts-ignore — L2Dwidget is a global from the loaded script
      if (typeof L2Dwidget === "undefined") return;
      // @ts-ignore
      L2Dwidget.init({
        pluginRootPath: "/live2d/",
        pluginJsPath: "/live2d/",
        pluginModelPath: "/live2d/models/",
        model: {
          jsonPath: "/live2d/models/" + (site.live2dModelPath || "hijiki/hijiki.model.json").replace(/^\/?live2d\/models\//, "").replace(/^\//, ""),
          scale: 1,
        },
        display: { superSample: 2, width: 140, height: 280, position: "left", hOffset: 0, vOffset: -20 },
        mobile: { show: true, scale: 0.5 },
        react: { opacityDefault: 0.8, opacityOnHover: 0.2 },
        dialog: {
          enable: true,
          script: {
            "tap body": "哎呀，别碰我那里！",
            "tap face": "人家脸红了啦...",
            "every 30s": ["今天也要加油哦～", "你写的代码真好看呢！", "累了就休息一下吧～"],
          },
        },
      });
    }

    // @ts-ignore
    if (typeof L2Dwidget !== "undefined") { tryInit(); return; }

    const script = document.createElement("script");
    script.src = "/live2d/L2Dwidget.min.js";
    script.async = true;
    script.onload = tryInit;
    script.onerror = () => {
      const cdn = document.createElement("script");
      cdn.src = "https://cdn.jsdelivr.net/npm/live2d-widget@3.1.4/lib/L2Dwidget.min.js";
      cdn.async = true;
      cdn.onload = tryInit;
      document.body.appendChild(cdn);
    };
    document.body.appendChild(script);
  }, []);

  return null;
}
