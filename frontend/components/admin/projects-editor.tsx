"use client";

import { useState } from "react";
import type { Project } from "@/lib/projects";
import { AdminButton, AdminInput, AdminTextarea, AdminConfirmDialog, showToast } from "./ui";

interface Props {
  projects: Project[];
  onChange: (list: Project[]) => void;
}

const emptyDraft = (): Project => ({ name: "", url: "", desc: "", tags: [], stars: "" });

export default function ProjectsEditor({ projects, onChange }: Props) {
  const [editing, setEditing] = useState<{ index: number; draft: Project } | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

  function startEdit(index: number) {
    setEditing({ index, draft: { ...projects[index], tags: [...projects[index].tags] } });
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
    const list = [...projects];
    if (editing.index === -1) list.push({ ...d, name: d.name.trim() });
    else list[editing.index] = { ...d, name: d.name.trim() };
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
                </div>
                {p.desc && <p className="text-xs text-text-secondary leading-relaxed mb-2 line-clamp-2">{p.desc}</p>}
                {p.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md text-[10px] bg-bg-mute text-text-muted">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
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
                  label="描述"
                  value={editing.draft.desc}
                  onChange={(e) => updateDraft({ desc: e.target.value })}
                  placeholder="一句话介绍这个项目"
                  rows={3}
                />
                <AdminInput
                  label="标签(逗号分隔)"
                  value={(editing.draft.tags || []).join(", ")}
                  onChange={(e) =>
                    updateDraft({ tags: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) })
                  }
                  placeholder="Next.js, Spring Boot, Docker"
                />
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
