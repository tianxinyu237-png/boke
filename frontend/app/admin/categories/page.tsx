"use client";

import { useState, useEffect } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory, type CategoryData } from "@/lib/categories";
import { AdminInput, AdminButton, AdminConfirmDialog, showToast } from "@/components/admin/ui";

export default function CategoriesAdminPage() {
  const [cats, setCats] = useState<CategoryData[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => { getCategories().then(c => setCats(c.sort((a,b) => a.sortOrder - b.sortOrder))); }, []);

  async function refresh() {
    const c = await getCategories();
    setCats(c.sort((a,b) => a.sortOrder - b.sortOrder));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug) return;
    try {
      if (editingId) {
        await updateCategory(editingId, { name, slug, description: desc });
        showToast(`已更新分类「${name}」`, "success");
      } else {
        await createCategory({ name, slug, description: desc, sortOrder: cats.length });
        showToast(`已创建分类「${name}」`, "success");
      }
      setName(""); setSlug(""); setDesc(""); setEditingId(null);
      await refresh();
    } catch (e: any) { showToast(e.message || "操作失败", "error"); }
  }

  function edit(cat: CategoryData) {
    setName(cat.name); setSlug(cat.slug); setDesc(cat.description || ""); setEditingId(cat.id);
  }

  function handleDeleteClick(id: number, name: string) {
    setConfirmTarget({ id, name });
    setConfirmOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!confirmTarget) return;
    setConfirmOpen(false);
    const { id, name } = confirmTarget;
    try {
      await deleteCategory(id);
      showToast(`已删除分类「${name}」`, "success");
      await refresh();
    } catch (e: any) {
      showToast(e.message || "删除失败", "error");
    } finally {
      setConfirmTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">分类管理</h2>
          <p className="text-text-muted text-xs mt-1">创建和管理文章大类 · 共 {cats.length} 个分类</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-bg-soft border border-border rounded-xl p-5 space-y-3">
        <div className="flex gap-3">
          <AdminInput
            label="分类名"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="如：嵌入式"
          />
          <AdminInput
            label="Slug"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="如：embedded"
          />
        </div>
        <AdminInput
          label="描述（可选）"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="简要描述这个分类"
        />
        <div className="flex gap-2 pt-1">
          <AdminButton type="submit">{editingId ? "更新分类" : "创建分类"}</AdminButton>
          {editingId && (
            <AdminButton variant="secondary" type="button" onClick={() => { setName(""); setSlug(""); setDesc(""); setEditingId(null); }}>
              取消编辑
            </AdminButton>
          )}
        </div>
      </form>

      {cats.length === 0 ? (
        <div className="text-center py-16 bg-bg-soft border border-border rounded-xl">
          <p className="text-text-muted text-sm mb-2">还没有分类</p>
          <p className="text-text-muted text-xs">在上方创建第一个分类，用于给文章归档</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cats.map(cat => (
            <div key={cat.id} className="flex items-center justify-between bg-bg-soft border border-border rounded-xl px-4 py-3 hover:border-accent/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-xs font-bold shrink-0">
                  {cat.name.charAt(0)}
                </div>
                <div>
                  <span className="text-sm font-medium text-text-primary">{cat.name}</span>
                  <span className="text-xs text-text-muted ml-2 font-mono">/{cat.slug}</span>
                  {cat.description && (
                    <span className="text-xs text-text-muted ml-2">— {cat.description}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => edit(cat)} className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-accent hover:bg-accent/10 transition-colors">编辑</button>
                <button onClick={() => handleDeleteClick(cat.id, cat.name)} className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminConfirmDialog
        open={confirmOpen}
        title="确认删除"
        message={confirmTarget ? `确定删除分类「${confirmTarget.name}」？` : ""}
        confirmLabel="删除"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
      />
    </div>
  );
}
