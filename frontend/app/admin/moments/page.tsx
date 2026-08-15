"use client";

import { useState, useEffect } from "react";
import { AdminButton, AdminConfirmDialog, showToast } from "@/components/admin/ui";

interface Moment {
  id: number; content: string; createdAt: string;
}

export default function MomentsAdminPage() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [content, setContent] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Moment | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const api = process.env.NEXT_PUBLIC_API_URL || "/api";
    const res = await fetch(api + "/moments");
    setMoments(await res.json());
  }

  async function addMoment(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    const token = localStorage.getItem("admin_token");
    const api = process.env.NEXT_PUBLIC_API_URL || "/api";
    await fetch(api + "/moments", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": token || "" },
      body: JSON.stringify({ content }),
    });
    showToast("碎碎念已发布", "success");
    setContent("");
    load();
  }

  function handleDeleteClick(moment: Moment) {
    setConfirmTarget(moment);
    setConfirmOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!confirmTarget) return;
    setConfirmOpen(false);
    const token = localStorage.getItem("admin_token");
    const api = process.env.NEXT_PUBLIC_API_URL || "/api";
    await fetch(api + "/moments/" + confirmTarget.id, {
      method: "DELETE", headers: { "X-Api-Key": token || "" }
    });
    showToast("已删除", "success");
    setConfirmTarget(null);
    load();
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary">碎碎念</h2>
        <p className="text-text-muted text-xs mt-1">发一条想法或动态 · 共 {moments.length} 条</p>
      </div>

      <form onSubmit={addMoment} className="bg-bg-soft border border-border rounded-xl p-5 space-y-3">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
          placeholder="写点什么..."
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-text-muted">{content.length} 字</span>
          <AdminButton type="submit" disabled={!content.trim()}>发布</AdminButton>
        </div>
      </form>

      {moments.length === 0 ? (
        <div className="text-center py-16 bg-bg-soft border border-border rounded-xl">
          <p className="text-text-muted text-sm mb-2">还没有碎碎念</p>
          <p className="text-text-muted text-xs">记录日常灵感、想法和动态</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border hidden sm:block" />
          <div className="space-y-3">
            {moments.map((m, i) => (
              <div key={m.id} className="relative pl-10 sm:pl-12">
                {/* Timeline dot */}
                <div className="absolute left-2.5 sm:left-[15px] top-3 w-3 h-3 rounded-full border-2 border-accent bg-bg hidden sm:block" />
                <div className="bg-bg-soft border border-border rounded-xl p-4 group hover:border-accent/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm text-text-secondary leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: m.content }}
                      />
                      <div className="text-[10px] text-text-muted mt-2">{formatTime(m.createdAt)}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteClick(m)}
                      className="text-xs text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AdminConfirmDialog
        open={confirmOpen}
        title="确认删除"
        message="确定删除这条碎碎念？"
        confirmLabel="删除"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
      />
    </div>
  );
}
