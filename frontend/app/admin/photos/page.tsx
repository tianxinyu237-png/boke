"use client";

import { useState, useEffect } from "react";
import { AdminInput, AdminButton, AdminConfirmDialog, showToast } from "@/components/admin/ui";

interface Photo {
  id: number; url: string; title?: string; description?: string;
}

export default function PhotosAdminPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Photo | null>(null);

  useEffect(() => { loadPhotos(); }, []);

  async function loadPhotos() {
    const api = process.env.NEXT_PUBLIC_API_URL || "/api";
    const res = await fetch(api + "/photos");
    setPhotos(await res.json());
  }

  async function addPhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    const token = localStorage.getItem("admin_token");
    const api = process.env.NEXT_PUBLIC_API_URL || "/api";
    const res = await fetch(api + "/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": token || "" },
      body: JSON.stringify({ url, title, description: desc }),
    });
    if (!res.ok) { showToast("添加失败", "error"); return; }
    showToast("照片已添加", "success");
    setUrl(""); setTitle(""); setDesc("");
    loadPhotos();
  }

  function handleDeleteClick(photo: Photo) {
    setConfirmTarget(photo);
    setConfirmOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!confirmTarget) return;
    setConfirmOpen(false);
    const token = localStorage.getItem("admin_token");
    const api = process.env.NEXT_PUBLIC_API_URL || "/api";
    const res = await fetch(api + "/photos/" + confirmTarget.id, {
      method: "DELETE", headers: { "X-Api-Key": token || "" }
    });
    if (!res.ok) { showToast("删除失败", "error"); return; }
    showToast("照片已删除", "success");
    setConfirmTarget(null);
    loadPhotos();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary">相册管理</h2>
        <p className="text-text-muted text-xs mt-1">上传和管理照片 · 共 {photos.length} 张</p>
      </div>

      <form onSubmit={addPhoto} className="bg-bg-soft border border-border rounded-xl p-5 space-y-3">
        <AdminInput
          label="图片URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com/photo.jpg"
          required
        />
        <div className="flex gap-3">
          <AdminInput label="标题（可选）" value={title} onChange={e => setTitle(e.target.value)} placeholder="照片标题" />
          <AdminInput label="描述（可选）" value={desc} onChange={e => setDesc(e.target.value)} placeholder="简短描述" />
        </div>
        <div className="flex items-end gap-3">
          <AdminButton type="submit">添加照片</AdminButton>
          {url && (
            <div className="w-20 h-14 rounded-lg overflow-hidden border border-border">
              <img src={url} alt="预览" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
            </div>
          )}
        </div>
      </form>

      {photos.length === 0 ? (
        <div className="text-center py-16 bg-bg-soft border border-border rounded-xl">
          <p className="text-text-muted text-sm mb-2">相册为空</p>
          <p className="text-text-muted text-xs">添加上方 URL 开始构建相册</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {photos.map(p => (
            <div key={p.id} className="relative group rounded-xl overflow-hidden border border-border bg-bg-soft">
              <img src={p.url} alt={p.title || ""} className="w-full aspect-square object-cover" />
              <button
                onClick={() => handleDeleteClick(p)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/90 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                aria-label="删除照片"
              >
                ×
              </button>
              {p.title && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-[10px] truncate">{p.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AdminConfirmDialog
        open={confirmOpen}
        title="确认删除"
        message={confirmTarget ? `确定删除这张照片${confirmTarget.title ? `「${confirmTarget.title}」` : ""}？` : ""}
        confirmLabel="删除"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
      />
    </div>
  );
}
