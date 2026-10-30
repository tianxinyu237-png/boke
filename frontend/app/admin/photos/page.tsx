"use client";

import { useState, useEffect, useRef } from "react";
import { AdminInput, AdminButton, AdminConfirmDialog, showToast } from "@/components/admin/ui";

interface Photo {
  id: number; url: string; title?: string; description?: string; sortOrder?: number;
}

const MAX_UPLOAD_MB = 10;

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL || "/api";
}

/** XHR 上传单张 —— 能拿到真实字节进度,fetch 做不到 */
function uploadFile(file: File, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", apiBase() + "/upload");
    const tk = localStorage.getItem("admin_token");
    if (tk) xhr.setRequestHeader("X-Api-Key", tk);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText).url);
        } catch {
          reject(new Error("响应解析失败"));
        }
      } else if (xhr.status === 413) {
        reject(new Error(`超过服务器 ${MAX_UPLOAD_MB}MB 限制`));
      } else if (xhr.status === 401) {
        reject(new Error("登录已过期,请重新登录后台"));
      } else {
        reject(new Error("HTTP " + xhr.status));
      }
    };
    xhr.onerror = () => reject(new Error("网络错误"));
    xhr.send(form);
  });
}

export default function PhotosAdminPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Photo | null>(null);

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [current, setCurrent] = useState({ idx: 0, total: 0, pct: 0, name: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadPhotos(); }, []);

  function token() {
    return localStorage.getItem("admin_token") || "";
  }

  async function loadPhotos() {
    const res = await fetch(apiBase() + "/photos");
    setPhotos(await res.json());
  }

  /** 上传只负责存文件;照片必须在 /api/photos 里有条目才会出现在相册。
   *  sortOrder 必须自己算:后端 POST 不传时默认 0,而 0 会插到相册最前面 ——
   *  用户预期是"新上传的加在最后",所以取当前最大 sortOrder 往后递增。 */
  async function createPhoto(photoUrl: string, photoTitle: string, sortOrder: number) {
    const res = await fetch(apiBase() + "/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": token() },
      body: JSON.stringify({ url: photoUrl, title: photoTitle, description: "", sortOrder }),
    });
    if (!res.ok) throw new Error("建记录失败 HTTP " + res.status);
  }

  /** 批量:逐张上传 + 建记录,单张失败不中断,最后汇总 */
  async function handleFiles(fileList: FileList | File[]) {
    const all = Array.from(fileList);
    const images = all.filter(f => f.type.startsWith("image/"));
    if (images.length === 0) {
      showToast(all.length ? "只能上传图片文件" : "没有选择文件", "error");
      return;
    }

    const oversize = images.filter(f => f.size > MAX_UPLOAD_MB * 1024 * 1024);
    const list = images.filter(f => f.size <= MAX_UPLOAD_MB * 1024 * 1024);
    if (oversize.length) {
      showToast(`${oversize.length} 张超过 ${MAX_UPLOAD_MB}MB 已跳过`, "error");
    }
    if (list.length === 0) return;

    setUploading(true);
    let ok = 0;
    const errors: string[] = [];
    // 从现有最大 sortOrder 往后接,保证新图排在相册末尾
    const baseOrder = photos.reduce((m, p) => Math.max(m, p.sortOrder ?? 0), 0);

    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      setCurrent({ idx: i + 1, total: list.length, pct: 0, name: f.name });
      try {
        const uploadedUrl = await uploadFile(f, pct =>
          setCurrent(prev => ({ ...prev, pct }))
        );
        await createPhoto(uploadedUrl, f.name.replace(/\.[^.]+$/, "") || "照片", baseOrder + i + 1);
        ok++;
      } catch (e) {
        errors.push(`${f.name}: ${e instanceof Error ? e.message : "未知错误"}`);
      }
    }

    setUploading(false);
    setCurrent({ idx: 0, total: 0, pct: 0, name: "" });
    if (fileRef.current) fileRef.current.value = "";

    if (errors.length === 0) {
      showToast(`已上传 ${ok} 张照片`, "success");
    } else {
      showToast(`成功 ${ok} 张，失败 ${errors.length} 张 — ${errors[0]}`, "error");
    }
    loadPhotos();
  }

  async function addPhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    const res = await fetch(apiBase() + "/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": token() },
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
    const res = await fetch(apiBase() + "/photos/" + confirmTarget.id, {
      method: "DELETE", headers: { "X-Api-Key": token() }
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

      {/* 拖拽 / 点击上传 */}
      <div
        onDragOver={e => { e.preventDefault(); if (!uploading) setDragOver(true); }}
        onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          if (uploading) return;
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => { if (!uploading) fileRef.current?.click(); }}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!uploading) fileRef.current?.click();
          }
        }}
        className={[
          "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          uploading ? "cursor-wait" : "cursor-pointer",
          dragOver
            ? "border-accent bg-accent/10"
            : "border-border bg-bg-soft hover:border-accent/50 hover:bg-accent/10",
        ].join(" ")}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); }}
        />

        {uploading ? (
          <div className="space-y-2">
            <p className="text-text-primary text-sm font-medium">
              正在上传 {current.idx}/{current.total}
            </p>
            <p className="text-text-muted text-xs truncate max-w-md mx-auto">{current.name}</p>
            <div className="h-1.5 w-64 mx-auto rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-accent transition-[width] duration-200"
                style={{ width: `${current.pct}%` }}
              />
            </div>
            <p className="text-text-muted text-[10px]">{current.pct}%</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-text-primary text-sm font-medium">
              {dragOver ? "松手即可上传" : "拖图片到这里，或点击选择"}
            </p>
            <p className="text-text-muted text-xs">
              支持多选 · 单张不超过 {MAX_UPLOAD_MB}MB · 上传后自动加入相册
            </p>
          </div>
        )}
      </div>

      {/* 手动填 URL,外链图片用 */}
      <form onSubmit={addPhoto} className="bg-bg-soft border border-border rounded-xl p-5 space-y-3">
        <p className="text-text-muted text-xs">或手动添加外链图片</p>
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
          <p className="text-text-muted text-xs">把图片拖到上面的虚线框里就能上传</p>
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
