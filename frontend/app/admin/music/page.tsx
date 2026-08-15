"use client";

import { useState, useEffect } from "react";
import {
  AdminInput,
  AdminButton,
  AdminConfirmDialog,
  AdminSkeleton,
  showToast,
} from "@/components/admin/ui";

interface Track {
  id: number; title: string; artist: string; url: string;
}

export default function MusicAdminPage() {
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [url, setUrl] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Track | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const api = process.env.NEXT_PUBLIC_API_URL || "/api";
    try {
      const res = await fetch(api + "/music");
      setTracks(await res.json());
    } catch {
      setTracks([]);
    }
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);

    const token = localStorage.getItem("admin_token");
    const api = process.env.NEXT_PUBLIC_API_URL || "/api";
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
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            setUrl(data.url);
            showToast("上传成功", "success");
          }
        } catch {
          showToast("上传失败: 解析响应失败", "error");
        }
      } else {
        showToast("上传失败，请检查文件大小（最大100MB）", "error");
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      showToast("上传失败: 网络错误", "error");
    };

    xhr.send(form);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !url) {
      showToast("请填写歌名和音频URL", "error");
      return;
    }
    const token = localStorage.getItem("admin_token");
    const api = process.env.NEXT_PUBLIC_API_URL || "/api";
    const body = { title, artist, url };
    try {
      if (editingId) {
        const res = await fetch(api + "/music/" + editingId, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "X-Api-Key": token || "" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("更新失败");
        showToast("已更新", "success");
      } else {
        const res = await fetch(api + "/music", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Api-Key": token || "" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("添加失败");
        showToast("已添加", "success");
      }
      setTitle(""); setArtist(""); setUrl(""); setEditingId(null);
      load();
    } catch {
      showToast("操作失败", "error");
    }
  }

  function handleDeleteClick(track: Track) {
    setConfirmTarget(track);
    setConfirmOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!confirmTarget) return;
    setConfirmOpen(false);
    const token = localStorage.getItem("admin_token");
    const api = process.env.NEXT_PUBLIC_API_URL || "/api";
    try {
      const res = await fetch(api + "/music/" + confirmTarget.id, {
        method: "DELETE",
        headers: { "X-Api-Key": token || "" },
      });
      if (!res.ok) throw new Error("删除失败");
      showToast(`已删除「${confirmTarget.title}」`, "success");
    } catch {
      showToast("删除失败", "error");
    }
    setConfirmTarget(null);
    load();
  }

  if (tracks === null) return <AdminSkeleton variant="list" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary">音乐管理</h2>
        <p className="text-text-muted text-xs mt-1">
          管理首页唱片播放器的歌曲 · 共 {tracks.length} 首
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-bg-soft border border-border rounded-xl p-5 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <AdminInput label="歌名" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="输入歌名" required />
          </div>
          <div className="flex-1">
            <AdminInput label="艺人" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="输入艺人名" />
          </div>
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <AdminInput label="音频 URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://... 或上传本地文件" />
          </div>
          <label className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-text-muted bg-bg-mute hover:text-accent cursor-pointer shrink-0 border border-border">
            {uploading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-12 h-1 rounded-full bg-bg-mute overflow-hidden">
                  <span className="block h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </span>
                <span className="text-accent text-[10px]">{uploadProgress}%</span>
              </span>
            ) : "📁 上传"}
            <input type="file" accept="audio/*" onChange={handleUpload} className="hidden" />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <AdminButton type="submit" variant="primary">
            {editingId ? "更新歌曲" : "添加歌曲"}
          </AdminButton>
          {editingId && (
            <AdminButton
              type="button"
              variant="secondary"
              onClick={() => { setTitle(""); setArtist(""); setUrl(""); setEditingId(null); }}
            >
              取消编辑
            </AdminButton>
          )}
        </div>
      </form>

      {tracks.length === 0 ? (
        <div className="bg-bg-soft border border-border rounded-xl p-12 text-center">
          <p className="text-text-muted text-sm">暂无歌曲</p>
          <p className="text-text-muted/60 text-xs mt-1">添加你的第一首歌吧</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((t, i) => (
            <div key={t.id} className="flex items-center justify-between bg-bg-soft border border-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-text-muted w-5 flex-shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-text-primary truncate">{t.title}</div>
                  <div className="text-xs text-text-muted">{t.artist || "—"}</div>
                </div>
                <audio controls className="h-7 w-32 flex-shrink-0" src={t.url} />
              </div>
              <div className="flex gap-2 shrink-0 ml-3">
                <button
                  onClick={() => { setTitle(t.title); setArtist(t.artist); setUrl(t.url); setEditingId(t.id); }}
                  className="text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDeleteClick(t)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminConfirmDialog
        open={confirmOpen}
        title="确认删除"
        message={`确定删除「${confirmTarget?.title}」？此操作不可撤销。`}
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
      />
    </div>
  );
}
