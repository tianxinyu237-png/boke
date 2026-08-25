"use client";

import { useState, useEffect, useMemo } from "react";
import { loadAboutConfig, saveAboutConfig, type AboutConfig, DEFAULT_ABOUT } from "@/lib/about";
import { loadLinksConfig, saveLinksConfig, type LinksConfig, DEFAULT_LINKS } from "@/lib/links";
import { loadProjectsConfig, saveProjectsConfig, type Project } from "@/lib/projects";
import { loadMusicConfig, saveMusicConfig, type MusicConfig, DEFAULT_MUSIC } from "@/lib/music";
import { loadThemeConfig, saveThemeConfig, type ThemeColors, DEFAULT_THEME } from "@/lib/theme";
import { loadResumeConfig, saveResumeConfig, type ResumeConfig, DEFAULT_RESUME } from "@/lib/resume";
import { loadOneLinerConfig, saveOneLinerConfig, type OneLinerConfig, DEFAULT_ONE_LINER } from "@/lib/oneliner";
import { AdminButton, showToast } from "@/components/admin/ui";
import ProjectsEditor from "@/components/admin/projects-editor";

type Tab = "about" | "links" | "projects" | "music" | "theme" | "resume" | "oneliner";

const tabMeta: Record<Tab, { label: string; icon: string; desc: string }> = {
  about:    { label: "关于页",   icon: "👤", desc: "个人简介、技术栈、联系方式" },
  links:    { label: "友链",     icon: "🔗", desc: "友情链接和交换信息" },
  projects: { label: "项目",     icon: "🚀", desc: "项目展示卡片(表单编辑,支持增删排序)" },
  music:    { label: "音乐",     icon: "🎵", desc: "黑胶播放器曲目列表" },
  theme:    { label: "主题色",   icon: "🎨", desc: "深色/浅色模式配色方案" },
  resume:   { label: "简历",     icon: "📄", desc: "简历页定位语、经历时间线、CTA 文案" },
  oneliner: { label: "一言",     icon: "✨", desc: "右下角一言挂件文案库,每行一句" },
};

const JSON_TEMPLATES: Record<Tab, string> = {
  about: `{
  "bio": "个人简介文字...",
  "techStack": [
    { "name": "React", "icon": "react", "level": 90 }
  ],
  "contacts": [
    { "type": "github", "url": "https://github.com/xxx", "label": "GitHub" }
  ]
}`,
  links: `{
  "friends": [
    { "name": "友链名", "url": "https://...", "avatar": "https://...", "description": "描述" }
  ]
}`,
  projects: `{
  "projects": [
    { "name": "项目名", "url": "https://...", "description": "描述", "icon": "🚀" }
  ]
}`,
  music: `{
  "playlist": [
    { "title": "歌曲名", "artist": "艺术家", "url": "/music/song.mp3", "cover": "/music/cover.jpg" }
  ]
}`,
  theme: `{
  "dark": {
    "accent": "#c084fc",
    "heroFrom": "#7DCDE8",
    "heroVia": "#c084fc",
    "heroTo": "#f093fb"
  },
  "light": {
    "accent": "#0ea5e9",
    "heroFrom": "#0ea5e9",
    "heroVia": "#22d3ee",
    "heroTo": "#38bdf8"
  }
}`,
  resume: `{
  "headline": "全能开发程序员",
  "bio": "可选，留空则使用关于页简介",
  "education": [
    { "period": "2024 - 至今", "org": "机构/学校", "title": "职位/专业", "desc": "描述..." }
  ],
  "ctaTitle": "想了解更多?",
  "ctaDesc": "看项目细节、技术笔记和完整博客",
  "ctaPrimary": "项目作品集",
  "ctaSecondary": "回博客首页"
}`,
  oneliner: `{
  "lines": [
    "代码写得好,头发少不了。",
    "人生苦短,我用 Python。"
  ]
}`,
};

export default function ContentManagementPage() {
  const [tab, setTab] = useState<Tab>("about");
  const [aboutJson, setAboutJson] = useState("");
  const [linksJson, setLinksJson] = useState("");
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [musicJson, setMusicJson] = useState("");
  const [themeJson, setThemeJson] = useState("");
  const [resumeJson, setResumeJson] = useState("");
  const [onelinerJson, setOnelinerJson] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAboutConfig().then((c) => setAboutJson(JSON.stringify({ bio: c.bio, techStack: c.techStack, contacts: c.contacts }, null, 2)));
    loadLinksConfig().then((c) => setLinksJson(JSON.stringify(c, null, 2)));
    loadProjectsConfig().then((c) => setProjectsList(c.projects));
    loadMusicConfig().then((c) => setMusicJson(JSON.stringify(c, null, 2)));
    loadThemeConfig().then((c) => setThemeJson(JSON.stringify(c, null, 2)));
    loadResumeConfig().then((c) => setResumeJson(JSON.stringify(c, null, 2)));
    loadOneLinerConfig().then((c) => setOnelinerJson(JSON.stringify(c, null, 2)));
  }, []);

  const jsonMap: Record<Tab, { val: string; set: (v: string) => void }> = {
    about: { val: aboutJson, set: setAboutJson },
    links: { val: linksJson, set: setLinksJson },
    projects: { val: "", set: () => {} },
    music: { val: musicJson, set: setMusicJson },
    theme: { val: themeJson, set: setThemeJson },
    resume: { val: resumeJson, set: setResumeJson },
    oneliner: { val: onelinerJson, set: setOnelinerJson },
  };

  const current = jsonMap[tab];
  const isValidJson = useMemo(() => {
    if (tab === "projects") return true;
    try { JSON.parse(current.val); return true; } catch { return false; }
  }, [current.val, tab]);

  async function handleSave() {
    if (tab === "projects") {
      setSaving(true);
      try {
        await saveProjectsConfig({ projects: projectsList });
        showToast("内容已保存", "success");
      } finally {
        setSaving(false);
      }
      return;
    }
    try {
      setSaving(true);
      const parsed = JSON.parse(current.val);
      switch (tab) {
        case "about":
          await saveAboutConfig({ ...DEFAULT_ABOUT, bio: parsed.bio || DEFAULT_ABOUT.bio, techStack: parsed.techStack || DEFAULT_ABOUT.techStack, contacts: parsed.contacts || DEFAULT_ABOUT.contacts });
          break;
        case "links":
          await saveLinksConfig({ ...DEFAULT_LINKS, ...parsed });
          break;
        case "music":
          await saveMusicConfig({ ...DEFAULT_MUSIC, ...parsed });
          break;
        case "theme":
          await saveThemeConfig({ ...DEFAULT_THEME, ...parsed });
          break;
        case "resume":
          await saveResumeConfig({ ...DEFAULT_RESUME, ...parsed });
          break;
        case "oneliner":
          await saveOneLinerConfig({ ...DEFAULT_ONE_LINER, lines: Array.isArray(parsed.lines) ? parsed.lines : DEFAULT_ONE_LINER.lines });
          break;
      }
      showToast("内容已保存", "success");
    } catch (e: any) {
      showToast("JSON 格式错误: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  function handleFormat() {
    try {
      const parsed = JSON.parse(current.val);
      current.set(JSON.stringify(parsed, null, 2));
    } catch {
      showToast("JSON 格式有误，无法格式化", "error");
    }
  }

  const currentMeta = tabMeta[tab];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">内容管理</h2>
          <p className="text-text-muted text-xs mt-1">编辑页面内容和样式配置（JSON格式）</p>
        </div>
        <div className="flex items-center gap-2">
          <AdminButton variant="secondary" onClick={handleFormat} disabled={!isValidJson}>
            格式化
          </AdminButton>
          <AdminButton onClick={handleSave} disabled={saving || !isValidJson}>
            {saving ? "保存中..." : "保存设置"}
          </AdminButton>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-bg-soft border border-border rounded-xl p-1">
        {Object.entries(tabMeta).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              tab === key
                ? "bg-accent/10 text-accent"
                : "text-text-muted hover:text-text-secondary hover:bg-bg-mute"
            }`}
          >
            <span>{meta.icon}</span>
            {meta.label}
          </button>
        ))}
      </div>

      {/* Current tab info */}
      <div className="flex items-center gap-3 px-4 py-3 bg-bg-soft border border-border rounded-xl">
        <span className="text-lg">{currentMeta.icon}</span>
        <div>
          <div className="text-sm font-medium text-text-primary">{currentMeta.label}</div>
          <div className="text-xs text-text-muted">{currentMeta.desc}</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isValidJson ? "bg-green-400" : "bg-red-400"}`} />
          <span className={`text-xs ${isValidJson ? "text-green-400" : "text-red-400"}`}>
            {isValidJson ? "JSON 有效" : "JSON 无效"}
          </span>
        </div>
      </div>

      {/* Editor */}
      {tab === "projects" ? (
        <ProjectsEditor projects={projectsList} onChange={setProjectsList} />
      ) : (
      <div className="bg-bg-soft border border-border rounded-xl overflow-hidden">
        <textarea
          value={current.val}
          onChange={(e) => current.set(e.target.value)}
          className="w-full h-[420px] bg-transparent p-5 text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none resize-none leading-relaxed"
          spellCheck={false}
        />
        <div className="flex items-center justify-between px-5 py-2.5 bg-bg-mute/50 border-t border-border text-[10px] text-text-muted">
          <span>直接编辑 JSON，保存后立即生效</span>
          <span>{current.val.split("\n").length} 行 · {current.val.length} 字符</span>
        </div>
      </div>
      )}

      {/* Template reference */}
      {tab !== "projects" && (
      <details className="bg-bg-soft border border-border rounded-xl overflow-hidden">
        <summary className="px-5 py-3 text-xs font-medium text-text-secondary cursor-pointer hover:text-text-primary transition-colors select-none">
          📋 {currentMeta.label} JSON 模板参考
        </summary>
        <div className="border-t border-border px-5 py-4">
          <pre className="text-xs font-mono text-text-muted leading-relaxed whitespace-pre-wrap">{JSON_TEMPLATES[tab]}</pre>
        </div>
      </details>
      )}
    </div>
  );
}
