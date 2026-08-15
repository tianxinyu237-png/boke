export interface CategoryData {
  id: number;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
}

export interface CategoryWithPosts extends CategoryData {
  posts: Post[];
  totalPosts: number;
}

import type { Post } from "@/components/post-card";

const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "/api")
  : "/api";

export async function getCategories(): Promise<CategoryData[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function getCategoryBySlug(slug: string): Promise<CategoryData | null> {
  try {
    const res = await fetch(`${API_BASE}/categories/${slug}`);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function createCategory(data: Partial<CategoryData>): Promise<CategoryData> {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const res = await fetch(`${API_BASE}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { "X-Api-Key": token } : {}) },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("创建失败");
  return res.json();
}

export async function updateCategory(id: number, data: Partial<CategoryData>): Promise<CategoryData> {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(token ? { "X-Api-Key": token } : {}) },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("更新失败");
  return res.json();
}

export async function deleteCategory(id: number): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: "DELETE",
    headers: token ? { "X-Api-Key": token } : {},
  });
  if (!res.ok) throw new Error("删除失败");
}
