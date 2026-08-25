"use client";

import { useState } from "react";
import type { Project, ProjectLink } from "@/lib/projects";
import { AdminButton, AdminInput, AdminTextarea, AdminConfirmDialog, showToast } from "./ui";

interface Props {
  projects: Project[];
  onChange: (list: Project[]) => void;
}

const emptyDraft = (): Project => ({
  name: "",
  url: "",
  desc: "",
  tags: [],
  stars: "",
  slug: "",
  longDesc: "",
  features: [],
  screenshots: [],
  links: [],
});

// 中文/空格等生成 URL 友好 slug:仅保留字母数字连字符
function genSlug(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s;
}

function parseLinks(text: string): ProjectLink[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.includes("|") ? "|" : line.includes("，") ? "，" : ",";
      const idx = line.indexOf(sep);
      if (idx === -1) return { label: line, url: line };
      return { label: line.slice(0, idx).trim(), url: line.slice(idx + 1).trim() };
    });
}

function linesToArray(text: string): string[] {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

export default function ProjectsEditor({ projects, onChange }: Props) {
  const [editing, setEditing] = useState<{ index: number; draft: Project } | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

  function startEdit(index: number) {
    const p = projects[index];
    setEditing({
      index,
      draft: {
        ...p,
        tags: [...p.tags],
        features: [...(p.features || [])],
        screenshots: [...(p.screenshots || [])],
        links: [...(p.links || [])],
      },
    });
  }

  function startAdd() {
    setEditing({ index: -1, draft: emptyDraft() });
  }

  function updateDraft(patch: Partial<Project>) {
    setEditing((e) => (e ? { ...e, draft: { ...e.draft, ...patch } } : e));
  }

  function commit() {
    if (!editing) return;
    const d = editing.draft;
    if (!d.name.trim()) {
      showToast("项目名称不能为空", "error");
      return;
    }
    const slug = d.slug?.trim() || genSlug(d.name);
    const final: Project = { ...d, name: d.name.trim(), slug };
    const list = [...projects];
    if (editing.index === -1) list.push(final);
    else list[editing.index] = final;
    onChange(list);
    setEditing(null);
    showToast(editing.index === -1 ? "项目已添加" : "项目已更新", "success");
  }

  function doRemove() {
    if (removing === null) return;
    const list = [...projects];
    list.splice(removing, 1);
    onChange(list);
    setRemoving(null);
    showToast("项目已删除", "success");
  }

  function move(index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= projects.length) return;
    const list = [...projects];
    [list[index], list[to]] = [list[to], list[index]];
    onChange(list);
  }

  const cardBtn =
    "w-6 h-6 rounded-md bg-bg-mute hover:bg-bg-mute/60 text-text-muted hover:text-text-primary transition-colors flex items-center justify-center";

  const hasDetail = (p: Project) =>
    !!(p.longDesc || (p.features && p.features.length) || (p.screenshots && p.screenshots.length) || (p.links && p.links.length));

  return (
    <div className="space-y-3">
      {projects.length === 0 && (
        <div className="bg-bg-soft border border-dashed border-border rounded-xl py-8 text-center text-xs text-text-muted">
          还没有项目,点击下方按钮添加第一个
        </div>
      )}

      {projects.map((p, i) => {
        const isOnline = !!p.url && p.url.startsWith("http");
        const isWip = !isOnline && /进行中|规划|开发中|TODO/i.test(p.desc || "");
        const isEditing = editing?.index === i;
        return (
          <div key={i} className="bg-bg-soft border border-border rounded-xl overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-text-primary truncate">{p.name || "未命名项目"}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                      isOnline
                        ? "bg-emerald-500/15 text-emerald-400"
                        : isWip
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {isOnline ? "线上" : isWip ? "进行中" : "项目"}
                  </span>
                  {p.slug && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-mute text-text-muted shrink-0 font-mono">
                      /projects/{p.slug}
                    </span>
                  )}
                </div>
                {p.desc && <p className="text-xs text-text-secondary leading-relaxed mb-2 line-clamp-2">{p.desc}</p>}
                <div className="flex flex-wrap gap-1">
                  {p.tags?.length > 0 &&
                    p.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md text-[10px] bg-bg-mute text-text-muted">
                        {t}
                      </span>
                    ))}
                  {!hasDetail(p) && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-amber-500/10 text-amber-400">
                      未填详情
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <div className="flex gap-1.5">
                  <button title="上移" onClick={() => move(i, -1)} className={cardBtn}>↑</button>
                  <button title="下移" onClick={() => move(i, 1)} className={cardBtn}>↓</button>
                </div>
                <div className="flex gap-1.5">
                  <button title="编辑" onClick={() => startEdit(i)} className={cardBtn}>✎</button>
                  <button title="删除" onClick={() => setRemoving(i)} className={`${cardBtn} hover:bg-red-500/20 hover:text-red-400`}>✕</button>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="border-t border-border p-4 space-y-3 bg-bg-mute/30">
                <AdminInput
                  label="项目名称"
                  value={editing.draft.name}
                  onChange={(e) => updateDraft({ name: e.target.value })}
                  placeholder="如:devlog 博客"
                />
                <AdminInput
                  label="链接(留空则不跳转)"
                  value={editing.draft.url || ""}
                  onChange={(e) => updateDraft({ url: e.target.value })}
                  placeholder="https:// 或站内路径,如 /"
                />
                <AdminTextarea
                  label="一句话简介(列表卡片显示)"
                  value={editing.draft.desc}
                  onChange={(e) => updateDraft({ desc: e.target.value })}
                  placeholder="一句话介绍这个项目"
                  rows={2}
                />
                <AdminInput
                  label="标签(逗号分隔)"
                  value={(editing.draft.tags || []).join(", ")}
                  onChange={(e) =>
                    updateDraft({ tags: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) })
                  }
                  placeholder="Next.js, Spring Boot, Docker"
                />

                {/* 详情内容 */}
                <details className="border border-border rounded-lg bg-bg-soft/60 overflow-hidden">
                  <summary className="px-3.5 py-2.5 text-xs font-medium text-text-secondary cursor-pointer hover:text-text-primary transition-colors select-none flex items-center gap-2">
                    <span>📄 详情页内容(可选)</span>
                    <span className="text-[10px] text-text-muted font-normal">
                      {hasDetail(editing.draft) ? "已填写" : "未填写"}
                    </span>
                  </summary>
                  <div className="border-t border-border px-3.5 py-3 space-y-3">
                    <AdminInput
                      label="详情页地址 slug(留空自动按名称生成)"
                      value={editing.draft.slug || ""}
                      onChange={(e) => updateDraft({ slug: e.target.value })}
                      placeholder={genSlug(editing.draft.name) || "devlog-blog"}
                    />
                    <AdminTextarea
                      label="详细介绍(支持 Markdown:标题/列表/代码块/表格)"
                      value={editing.draft.longDesc || ""}
                      onChange={(e) => updateDraft({ longDesc: e.target.value })}
                      placeholder={"## 项目背景\n\n介绍这个项目...\n\n```bash\nnpm run dev\n```"}
                      rows={7}
                    />
                    <AdminTextarea
                      label="特性亮点(每行一条,详情页 ✓ 列表展示)"
                      value={(editing.draft.features || []).join("\n")}
                      onChange={(e) => updateDraft({ features: linesToArray(e.target.value) })}
                      placeholder={"暗色/亮色双主题\nMarkdown 实时渲染\nLive2D 看板娘"}
                      rows={4}
                    />
                    <AdminTextarea
                      label="截图/封面图 URL(每行一个,详情页画廊展示)"
                      value={(editing.draft.screenshots || []).join("\n")}
                      onChange={(e) => updateDraft({ screenshots: linesToArray(e.target.value) })}
                      placeholder="https://example.com/screenshot1.png"
                      rows={3}
                    />
                    <AdminTextarea
                      label="附加链接(每行:名称|网址,详情页按钮展示)"
                      value={(editing.draft.links || []).map((l) => `${l.label}|${l.url}`).join("\n")}
                      onChange={(e) => updateDraft({ links: parseLinks(e.target.value) })}
                      placeholder={"GitHub 源码|https://github.com/xxx\n在线演示|https://demo.xxx.com"}
                      rows={3}
                    />
                  </div>
                </details>

                <div className="flex justify-end gap-2 pt-1">
                  <AdminButton variant="secondary" onClick={() => setEditing(null)}>取消</AdminButton>
                  <AdminButton onClick={commit}>{editing.index === -1 ? "添加项目" : "保存修改"}</AdminButton>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <AdminButton variant="secondary" onClick={startAdd} className="w-full">+ 添加项目</AdminButton>

      <AdminConfirmDialog
        open={removing !== null}
        title="删除项目"
        message={removing !== null && projects[removing] ? `确定删除「${projects[removing].name || "未命名项目"}」吗?` : ""}
        confirmLabel="删除"
        onConfirm={doRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
