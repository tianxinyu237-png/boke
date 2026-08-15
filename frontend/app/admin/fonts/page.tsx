"use client";

import { useState, useEffect } from "react";
import { loadFontConfig, saveFontConfig, type FontConfig, FONT_OPTIONS } from "@/lib/fonts";
import { showToast, AdminSkeleton } from "@/components/admin/ui";

const SAMPLE_TEXT_CN = "天地玄黄 宇宙洪荒 日月盈昃 辰宿列张";
const SAMPLE_TEXT_EN = "The quick brown fox jumps over the lazy dog.";
const SAMPLE_PARAGRAPH = "字体是设计中最基础也最重要的元素之一。合适的字体能让文字更易读、更有表现力，为整个页面的视觉风格奠定基调。选择字体时需要考虑可读性、风格匹配度以及中英文混排的协调性。";

export default function FontSettingsPage() {
  const [config, setConfig] = useState<FontConfig | null>(null);

  useEffect(() => {
    setConfig(loadFontConfig());
  }, []);

  function selectFont(value: string) {
    const newConfig = { sans: value };
    setConfig(newConfig);
    saveFontConfig(newConfig);
    window.dispatchEvent(new CustomEvent("font-config-change"));
    const font = FONT_OPTIONS.find(f => f.value === value);
    showToast(`已切换为「${font?.label || value}」`, "success");
  }

  if (!config) return <AdminSkeleton variant="card" />;

  const selectedFont = FONT_OPTIONS.find(f => f.value === config.sans);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary">字体设置</h2>
        <p className="text-text-muted text-xs mt-1">选择博客正文字体，即时生效 · 当前：{selectedFont?.label}</p>
      </div>

      {/* Live preview card */}
      <div className="bg-bg-soft border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">实时预览</h3>
        <div
          className="space-y-3 p-5 rounded-xl bg-bg border border-border"
          style={{ fontFamily: config.sans === "inter" ? "var(--font-geist)" : `"${selectedFont?.label?.replace(/（.*）/, "")}", sans-serif` }}
        >
          <div className="text-2xl font-bold text-text-primary">{SAMPLE_TEXT_CN}</div>
          <div className="text-base text-text-secondary italic">{SAMPLE_TEXT_EN}</div>
          <div className="text-sm text-text-secondary leading-relaxed max-w-2xl">{SAMPLE_PARAGRAPH}</div>
          <div className="flex gap-4 text-xs text-text-muted">
            <span>常规 400</span>
            <span className="font-medium">中等 500</span>
            <span className="font-semibold">半粗 600</span>
            <span className="font-bold">粗体 700</span>
          </div>
        </div>
      </div>

      {/* Font grid */}
      <div className="bg-bg-soft border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">选择字体</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font.value}
              onClick={() => selectFont(font.value)}
              className={`text-left px-4 py-4 rounded-xl border transition-all ${
                config.sans === font.value
                  ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                  : "border-border bg-bg hover:border-accent/20 hover:bg-bg-mute"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${config.sans === font.value ? "text-accent" : "text-text-primary"}`}>
                  {font.label}
                </span>
                {config.sans === font.value && (
                  <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>
              <div
                className="text-xs text-text-muted leading-relaxed"
                style={{ fontFamily: font.value === "inter" ? "var(--font-geist)" : `"${font.label.replace(/（.*）/, "")}", sans-serif` }}
              >
                {SAMPLE_TEXT_CN}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
