"use client";

import { fetchAllTags, type PostData } from "@/lib/admin/api";
import { getCategories, type CategoryData } from "@/lib/categories";
import dynamic from "next/dynamic";
const MarkdownEditor = dynamic(() => import("@/components/admin/markdown-editor"), { ssr: false });
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminInput, AdminTextarea, AdminButton, AdminAlert, AdminBadge } from "@/components/admin/ui";

interface PostEditorProps {
  initial?: Partial<PostData>;
  onSave: (data: PostData) => Promise<void>;
  mode: "create" | "edit";
}

export default function PostEditor({ initial, onSave, mode }: PostEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [content, setContent] = useState(initial?.content || "");
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [readTime, setReadTime] = useState(initial?.readTime || "");
  const [tagsInput, setTagsInput] = useState((initial?.tags || []).join(", "));
  const [coverImage, setCoverImage] = useState(initial?.coverImage || "");
  const [coverUploading, setCoverUploading] = useState(false);
  const [pinned, setPinned] = useState(initial?.pinned || false);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(initial?.categoryId || undefined);

  useEffect(() => { getCategories().then(setCategories); }, []);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllTags().then(setExistingTags).catch(() => {});
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (mode === "create" && !slug) {
      const auto = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(auto);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("请输入标题"); return; }
    if (!slug.trim()) { setError("请输入 slug"); return; }
    if (!content.trim()) { setError("请输入文章内容"); return; }

    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        excerpt: excerpt.trim() || title.trim(),
        content, date,
        readTime: readTime.trim() || `${Math.ceil(content.length / 500)} min`,
        tags,
        coverImage: coverImage.trim() || undefined,
        pinned,
        categoryId: categoryId || undefined,
      });
    } catch (e: any) {
      setError(e.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${api}/upload`, {
        method: "POST",
        headers: token ? { "X-Api-Key": token } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("上传失败");
      const data = await res.json();
      // Prepend API base URL path
      setCoverImage(data.url);
    } catch (err: any) {
      setError(err.message || "封面图上传失败");
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            {mode === "create" ? "新建文章" : "编辑文章"}
          </h1>
          <p className="text-text-muted text-xs mt-1">
            {mode === "create" ? "创建一篇新的博客文章" : `正在编辑: ${initial?.title}`}
          </p>
        </div>
        <AdminButton variant="secondary" onClick={() => router.back()}>
          返回
        </AdminButton>
      </div>

      {error && <AdminAlert>{error}</AdminAlert>}

      <form onSubmit={handleSubmit} className="bg-bg-soft border border-border rounded-2xl p-6 space-y-5">
        <AdminInput
          label="标题" required
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="文章标题"
        />

        <AdminInput
          label="Slug (URL 路径)" required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="my-article-slug"
          className="font-mono"
        />
        <p className="text-text-muted text-[10px] -mt-3">访问地址: /posts/{slug || "..."}</p>

        <div className="grid grid-cols-2 gap-4">
          <AdminInput
            label="日期"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <AdminInput
            label="阅读时长"
            value={readTime}
            onChange={(e) => setReadTime(e.target.value)}
            placeholder="自动计算"
          />
        </div>

        <AdminTextarea
          label="摘要"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="文章简介，显示在列表页..."
          rows={2}
        />

        {/* Cover image */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">封面图</label>
          <div className="flex items-start gap-3">
            {/* Preview */}
            {coverImage && (
              <div className="w-32 h-20 shrink-0 rounded-lg overflow-hidden border border-border bg-bg-mute">
                <img
                  src={coverImage.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${coverImage}` : coverImage}
                  alt="封面预览"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="输入图片URL或上传本地图片"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors outline-none"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted bg-bg-mute hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {coverUploading ? "上传中..." : "上传图片"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={coverUploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">标签 (逗号分隔)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="typescript, react, web"
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors outline-none"
          />
          {existingTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {existingTags.map((tag) => (
                <button
                  key={tag} type="button"
                  onClick={() => {
                    const current = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
                    if (!current.includes(tag)) setTagsInput([...current, tag].join(", "));
                  }}
                  className="px-2 py-0.5 rounded-md text-[10px] bg-bg-mute text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category + Pinned */}
        <div className="flex items-center gap-4">
          {categories.length > 0 && (
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">分类</label>
              <select
                value={categoryId || ""}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
              >
                <option value="">无分类</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}
          <label className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="accent-accent w-4 h-4"
            />
            <span className="text-sm text-text-secondary">置顶</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            内容 (Markdown) <span className="text-red-400">*</span>
          </label>
          <div className="border border-border rounded-xl overflow-hidden">
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="开始写作..."
              height={480}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <AdminButton type="submit" disabled={saving}>
            {saving ? "保存中..." : mode === "create" ? "发布文章" : "保存修改"}
          </AdminButton>
          <AdminButton type="button" variant="secondary" onClick={() => router.back()}>
            取消
          </AdminButton>
        </div>
      </form>
    </div>
  );
}
