"use client";

import { useState, useEffect, useRef } from "react";
import { showToast, AdminSkeleton } from "@/components/admin/ui";
import { loadBgConfig, saveBgConfig, saveBgConfigToServer, type BackgroundConfig } from "@/lib/background";

export default function BackgroundSettingsPage() {
  const [config, setConfig] = useState<BackgroundConfig | null>(null);
  const configRef = useRef<BackgroundConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTarget, setUploadTarget] = useState<"url" | "welcomeUrl" | null>(null);

  useEffect(() => {
    const cfg = loadBgConfig();
    setConfig(cfg);
    configRef.current = cfg;
  }, []);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const MAX_UPLOAD_MB = 500;

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>, target: "url" | "welcomeUrl") {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      showToast(
        `上传失败: 文件超过 ${MAX_UPLOAD_MB}MB 限制(当前 ${(file.size / 1024 / 1024).toFixed(0)}MB)`,
        "error"
      );
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setUploadTarget(target);

    const token = localStorage.getItem("admin_token");
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", api + "/upload");

    if (token) xhr.setRequestHeader("X-Api-Key", token);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      setUploadTarget(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          update(target, data.url);
          const ext = file.name.split(".").pop()?.toLowerCase();
          if (ext === "mp4" || ext === "webm" || ext === "mov") {
            if (target === "url") update("type", "video");
            else if (target === "welcomeUrl") update("welcomeType", "video");
          }
        } catch {
          showToast("上传失败: 解析响应失败", "error");
        }
      } else if (xhr.status === 413) {
        showToast(`上传失败: 文件超过服务器 ${MAX_UPLOAD_MB}MB 限制`, "error");
      } else {
        showToast("上传失败: HTTP " + xhr.status, "error");
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setUploadTarget(null);
      showToast("上传失败: 网络错误", "error");
    };

    xhr.send(form);
  }

  function update<K extends keyof BackgroundConfig>(key: K, value: BackgroundConfig[K]) {
    setConfig((prev) => {
      const next = prev ? { ...prev, [key]: value } : prev;
      configRef.current = next;
      return next;
    });
  }

  async function handleSave() {
    const cfg = configRef.current;
    if (!cfg) return;
    setSaving(true);
    saveBgConfig(cfg);
    const ok = await saveBgConfigToServer(cfg);
    setSaving(false);
    if (ok) {
      window.dispatchEvent(new CustomEvent("bg-config-change"));
      showToast("背景设置已保存", "success");
    } else {
      showToast("保存失败，请重新登录后重试", "error");
    }
  }

  if (!config) return <AdminSkeleton variant="form" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">背景设置</h2>
          <p className="text-text-muted text-xs mt-1">设置全站背景图片或视频</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-accent hover:bg-accent/80 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
        >
          {saving ? "保存中..." : "保存设置"}
        </button>
      </div>

      {/* Enable */}
      <div className="bg-bg-soft border border-border rounded-xl p-5 space-y-4">
        <label className="flex items-center justify-between">
          <span className="text-sm text-text-primary">启用背景</span>
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

      {config.enabled && (
        <>
          {/* Type: image or video */}
          <div className="bg-bg-soft border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">背景类型</h3>
            <div className="flex gap-3">
              {(["image", "video"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => update("type", type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    config.type === type
                      ? "bg-accent/10 text-accent border border-accent/30"
                      : "bg-bg-mute text-text-muted border border-border"
                  }`}
                >
                  {type === "image" ? "🖼️ 图片" : "🎬 视频"}
                </button>
              ))}
            </div>

            {/* URL input */}
            <div>
              <label className="text-xs text-text-muted block mb-1.5">
                {config.type === "video" ? "视频URL (.mp4/.webm)" : "图片URL"}
              </label>
              <input
                type="text"
                value={config.url}
                onChange={(e) => update("url", e.target.value)}
                placeholder={config.type === "video" ? "https://example.com/bg.mp4" : "https://example.com/bg.jpg"}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted bg-bg-mute hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer mt-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {uploading && uploadTarget === "url" ? (
                  <span className="flex items-center gap-2">
                    <span className="w-16 h-1.5 rounded-full bg-bg-mute overflow-hidden">
                      <span className="block h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </span>
                    <span className="text-accent">{uploadProgress}%</span>
                  </span>
                ) : "本地上传"}
                <input type="file" accept="image/*,video/*" onChange={(e) => handleUpload(e, "url")} disabled={uploading} className="hidden" />
              </label>

              {config.url && config.type === "image" && (
                <div className="mt-3 h-24 rounded-lg overflow-hidden border border-border">
                  <img
                    src={config.url}
                    alt="预览"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
              {config.url && config.type === "video" && (
                <video
                  key={config.url}
                  src={config.url}
                  controls
                  muted
                  playsInline
                  className="mt-3 w-full h-40 rounded-lg border border-border object-contain bg-black/40"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
            </div>

            {/* Opacity */}
            <div>
              <label className="text-xs text-text-muted block mb-1">透明度</label>
              <input
                type="range"
                min={0.05}
                max={0.95}
                step={0.05}
                value={config.opacity}
                onChange={(e) => update("opacity", Number(e.target.value))}
                className="w-full accent-accent"
              />
              <span className="text-xs text-text-muted">{config.opacity.toFixed(2)}</span>
            </div>

            {/* Blur */}
            <div>
              <label className="text-xs text-text-muted block mb-1">模糊</label>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={config.blur}
                onChange={(e) => update("blur", Number(e.target.value))}
                className="w-full accent-accent"
              />
              <span className="text-xs text-text-muted">{config.blur}px</span>
            </div>
          </div>

          {/* Mobile */}
          <div className="bg-bg-soft border border-border rounded-xl p-5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.enableMobile}
                onChange={(e) => update("enableMobile", e.target.checked)}
                className="accent-accent"
              />
              <span className="text-text-secondary">启用移动端背景</span>
            </label>
          </div>
        </>
      )}

      {/* ── Welcome page background ── */}
      <div className="bg-bg-soft border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">🚪 欢迎页专属壁纸</h3>
          <button
            onClick={() => update("welcomeEnabled", !config.welcomeEnabled)}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              config.welcomeEnabled ? "bg-accent" : "bg-bg-mute"
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              config.welcomeEnabled ? "translate-x-4" : ""
            }`} />
          </button>
        </div>
        <p className="text-xs text-text-muted -mt-2">
          开启后首次访问时展示专属壁纸，关闭则用全站背景
        </p>

        {config.welcomeEnabled && (
          <>
            <div className="flex gap-3">
              {(["image", "video"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => update("welcomeType", type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    config.welcomeType === type
                      ? "bg-accent/10 text-accent border border-accent/30"
                      : "bg-bg-mute text-text-muted border border-border"
                  }`}
                >
                  {type === "image" ? "🖼️ 图片" : "🎬 视频"}
                </button>
              ))}
            </div>

            <div>
              <input
                type="text"
                value={config.welcomeUrl}
                onChange={(e) => update("welcomeUrl", e.target.value)}
                placeholder={config.welcomeType === "video" ? "https://example.com/welcome.mp4" : "https://example.com/welcome.jpg"}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
              />
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted bg-bg-mute hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer mt-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {uploading && uploadTarget === "welcomeUrl" ? (
                    <span className="flex items-center gap-2">
                      <span className="w-16 h-1.5 rounded-full bg-bg-mute overflow-hidden">
                        <span className="block h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </span>
                      <span className="text-accent">{uploadProgress}%</span>
                    </span>
                  ) : "本地上传"}
                  <input type="file" accept="image/*,video/*" onChange={(e) => handleUpload(e, "welcomeUrl")} disabled={uploading} className="hidden" />
                </label>
  
              {config.welcomeUrl && config.welcomeType === "image" && (
                <div className="mt-3 h-24 rounded-lg overflow-hidden border border-border">
                  <img src={config.welcomeUrl} alt="预览" className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
              {config.welcomeUrl && config.welcomeType === "video" && (
                <video
                  key={config.welcomeUrl}
                  src={config.welcomeUrl}
                  controls
                  muted
                  playsInline
                  className="mt-3 w-full h-40 rounded-lg border border-border object-contain bg-black/40"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
