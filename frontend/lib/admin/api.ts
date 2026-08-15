const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export interface PostData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  tags: string[];
  coverImage?: string;
  pinned?: boolean;
  categoryId?: number;
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["X-Api-Key"] = token;
  return headers;
}

async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error("请求失败");
  return res.json();
}

async function apiWrite(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "请求失败" }));
    throw new Error(err.error || "请求失败");
  }
  return res.json();
}

export async function fetchPosts(params?: {
  search?: string;
  tag?: string;
  page?: number;
}): Promise<{ posts: PostData[]; totalPages: number; totalElements: number }> {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.tag) sp.set("tag", params.tag);
  if (params?.page != null) sp.set("page", String(params.page));
  sp.set("size", "50");
  return apiGet(`/posts?${sp}`);
}

export async function fetchPost(slug: string): Promise<PostData> {
  return apiGet(`/posts/${slug}`);
}

export async function createPost(data: PostData): Promise<PostData> {
  return apiWrite("POST", "/posts", data);
}

export async function updatePost(slug: string, data: Partial<PostData>): Promise<PostData> {
  return apiWrite("PUT", `/posts/${slug}`, data);
}

export async function deletePost(slug: string): Promise<void> {
  await apiWrite("DELETE", `/posts/${slug}`);
}

export async function fetchAllTags(): Promise<string[]> {
  try {
    return await apiGet("/tags");
  } catch {
    return [];
  }
}
