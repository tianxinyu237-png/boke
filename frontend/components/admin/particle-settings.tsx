"use client";

import { useState, useEffect } from "react";
import { showToast, AdminSkeleton } from "@/components/admin/ui";
import {
  loadConfig,
  saveConfig,
  type ParticleConfig,
  EFFECTS,
  CURSOR_EFFECTS,
  CURSOR_TEMPLATES,
} from "@/lib/particles";

export default function ParticleSettings() {
  const [config, setConfig] = useState<ParticleConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  function update<K extends keyof ParticleConfig>(key: K, value: ParticleConfig[K]) {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaving(false);
  }

  function handleSave() {
    if (!config) return;
    setSaving(true);
    saveConfig(config);
    // Trigger reload of particles
    window.dispatchEvent(
      new CustomEvent("particle-config-change", {
        detail: {
          enabled: config.enabled,
          effect: config.effect,
          cursorEffect: config.cursorEffect,
          count: config.count,
          color: config.color,
          opacity: config.opacity,
          speed: config.speed,
          enableMobile: config.enableMobile,
          pageMode: config.pageMode,
          includePaths: config.includePaths
            ? config.includePaths.split("\n").filter(Boolean)
            : [],
          excludePaths: config.excludePaths
            ? config.excludePaths.split("\n").filter(Boolean)
            : [],
          cursorStyleEnabled: config.cursorStyleEnabled,
          cursorStyleTemplate: config.cursorStyleTemplate,
          cursorStyleImage: config.cursorStyleImage,
          zIndex: config.zIndex,
        },
      })
    );
    setSaving(false);
    showToast("粒子设置已保存", "success");
  }

  if (!config) return <AdminSkeleton variant="form" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">粒子动效设置</h2>
          <p className="text-text-muted text-xs mt-1">配置全站页面粒子效果和鼠标交互动效</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-accent hover:bg-accent/80 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
        >
          {saving ? "保存中..." : "保存设置"}
        </button>
      </div>

      <div className="bg-bg-soft border border-border rounded-xl p-5 space-y-4">
        {/* Enable switch */}
        <label className="flex items-center justify-between">
          <span className="text-sm text-text-primary">开启前台动效</span>
          <button
            onClick={() => update("enabled", !config.enabled)}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              config.enabled ? "bg-accent" : "bg-bg-mute"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                config.enabled ? "translate-x-4" : ""
              }`}
            />
          </button>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Page particles */}
        <div className="bg-bg-soft border border-border rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">页面粒子效果</h3>
          <select
            value={config.effect}
            onChange={(e) => update("effect", e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          >
            {EFFECTS.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">数量</label>
              <input
                type="range"
                min={20}
                max={200}
                value={config.count}
                onChange={(e) => update("count", Number(e.target.value))}
                className="w-full accent-accent"
              />
              <span className="text-xs text-text-muted">{config.count}</span>
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">透明度</label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={config.opacity}
                onChange={(e) => update("opacity", Number(e.target.value))}
                className="w-full accent-accent"
              />
              <span className="text-xs text-text-muted">{config.opacity.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">速度</label>
              <input
                type="range"
                min={0.2}
                max={3}
                step={0.1}
                value={config.speed}
                onChange={(e) => update("speed", Number(e.target.value))}
                className="w-full accent-accent"
              />
              <span className="text-xs text-text-muted">{config.speed.toFixed(1)}</span>
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">颜色</label>
              <input
                type="color"
                value={config.color}
                onChange={(e) => update("color", e.target.value)}
                className="w-full h-8 rounded border border-border bg-bg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Cursor effects */}
        <div className="bg-bg-soft border border-border rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">鼠标动效</h3>
          <select
            value={config.cursorEffect}
            onChange={(e) => update("cursorEffect", e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          >
            {CURSOR_EFFECTS.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>

          {/* Cursor style */}
          <label className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">启用自定义鼠标样式</span>
            <button
              onClick={() => update("cursorStyleEnabled", !config.cursorStyleEnabled)}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                config.cursorStyleEnabled ? "bg-accent" : "bg-bg-mute"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  config.cursorStyleEnabled ? "translate-x-4" : ""
                }`}
              />
            </button>
          </label>

          {config.cursorStyleEnabled && (
            <select
              value={config.cursorStyleTemplate}
              onChange={(e) => update("cursorStyleTemplate", e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
            >
              {CURSOR_TEMPLATES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Mobile & page mode */}
      <div className="bg-bg-soft border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.enableMobile}
              onChange={(e) => update("enableMobile", e.target.checked)}
              className="accent-accent"
            />
            <span className="text-text-secondary">启用移动端效果</span>
          </label>

          <label className="text-xs text-text-muted">动效层级 (z-index)</label>
          <input
            type="number"
            value={config.zIndex}
            onChange={(e) => update("zIndex", Number(e.target.value))}
            className="w-28 bg-bg border border-border rounded px-2 py-1 text-xs text-text-primary"
          />
        </div>
      </div>
    </div>
  );
}
