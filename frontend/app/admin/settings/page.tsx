"use client";

import { useSiteConfig } from "@/components/site-config-provider";
import { useState } from "react";
import { AdminInput, AdminButton, showToast } from "@/components/admin/ui";

export default function SiteSettingsPage() {
  const { config, update } = useSiteConfig();
  const [saving, setSaving] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // Auto-save via SiteConfigProvider's update
    showToast("站点设置已保存", "success");
    setTimeout(() => setSaving(false), 1500);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">站点设置</h2>
          <p className="text-text-muted text-xs mt-1">修改站点名称、描述、SEO、域名等信息</p>
        </div>
        <AdminButton type="submit" form="site-settings-form" disabled={saving}>
          {saving ? "保存中..." : "保存设置"}
        </AdminButton>
      </div>

      <form id="site-settings-form" onSubmit={handleSave} className="bg-bg-soft border border-border rounded-xl p-5 space-y-4">
        <AdminInput
          label="站点名称"
          value={config.name}
          onChange={(e) => update({ name: e.target.value })}
        />
        <AdminInput
          label="描述"
          value={config.description}
          onChange={(e) => update({ description: e.target.value })}
        />
        <AdminInput
          label="标语"
          value={config.tagline}
          onChange={(e) => update({ tagline: e.target.value })}
        />
        <div>
          <AdminInput
            label="建站日期"
            type="date"
            value={config.founded}
            onChange={(e) => update({ founded: e.target.value })}
          />
          <p className="text-[10px] text-text-muted mt-1">用于页脚"已运行X天"计算</p>
        </div>
        <AdminInput
          label="SEO 关键词（逗号分隔）"
          value={config.keywords}
          onChange={(e) => update({ keywords: e.target.value })}
          placeholder="博客,技术,编程"
        />

        <div className="grid grid-cols-2 gap-4">
          <AdminInput
            label="头像文字"
            value={config.avatar}
            onChange={(e) => update({ avatar: e.target.value })}
            maxLength={3}
          />
          <AdminInput
            label="头像图片URL"
            value={config.avatarUrl}
            onChange={(e) => update({ avatarUrl: e.target.value })}
            placeholder="留空则显示文字"
          />
        </div>

        <AdminInput
          label="默认封面图URL（文章无封面时使用）"
          value={config.defaultCoverImage || ""}
          onChange={(e) => update({ defaultCoverImage: e.target.value })}
          placeholder="留空则用随机图"
        />

        {/* Giscus */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-medium text-text-secondary mb-3">💬 Giscus 评论配置</p>
          <div className="grid grid-cols-2 gap-3">
            <AdminInput
              label="GitHub 仓库（如 user/repo）"
              value={config.giscusRepo || ""}
              onChange={(e) => update({ giscusRepo: e.target.value })}
            />
            <AdminInput
              label="Repository ID"
              value={config.giscusRepoId || ""}
              onChange={(e) => update({ giscusRepoId: e.target.value })}
            />
            <AdminInput
              label="Discussion 分类"
              value={config.giscusCategory || ""}
              onChange={(e) => update({ giscusCategory: e.target.value })}
            />
            <AdminInput
              label="Category ID"
              value={config.giscusCategoryId || ""}
              onChange={(e) => update({ giscusCategoryId: e.target.value })}
            />
          </div>
          <p className="text-[10px] text-text-muted mt-1">
            去 <a href="https://giscus.app" target="_blank" className="text-accent hover:underline">giscus.app</a> 生成配置
          </p>
        </div>

        {/* Live2D */}
        <div className="pt-4 border-t border-border">
          <AdminInput
            label="🎭 看板娘模型路径"
            value={config.live2dModelPath || ""}
            onChange={(e) => update({ live2dModelPath: e.target.value })}
            placeholder="/live2d/models/hijiki/hijiki.model.json"
          />
          <p className="text-[10px] text-text-muted mt-1">模型文件需放在 public/live2d/models/ 目录下</p>
        </div>

        {/* Preview */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-text-muted mb-3">预览效果</p>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-bg">
            {config.avatarUrl ? (
              <img src={config.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover ring-1 ring-accent/20" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold ring-1 ring-accent/20">
                {config.avatar || "?"}
              </div>
            )}
            <div>
              <div className="text-sm font-semibold text-text-primary">{config.name}</div>
              <div className="text-xs text-text-muted">{config.description}</div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
