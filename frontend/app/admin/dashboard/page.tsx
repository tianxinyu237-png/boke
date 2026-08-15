"use client";

import { fetchPosts, deletePost, type PostData } from "@/lib/admin/api";
import { getCategories } from "@/lib/categories";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  AdminSkeleton,
  IconEdit,
  IconTrash,
  IconExternal,
  IconSearch,
  IconNew,
  IconPosts,
  IconNotes,
  IconFolder,
  IconPhoto,
  AdminButton,
  AdminBadge,
  AdminAlert,
  AdminConfirmDialog,
  showToast,
} from "@/components/admin/ui";

interface Stats {
  posts: number;
  categories: number;
  notes: number;
  photos: number;
  lastUpdated: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ slug: string; title: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [stats, setStats] = useState<Stats>({ posts: 0, categories: 0, notes: 0, photos: 0, lastUpdated: "-" });

  // Load stats independently from filtered post list
  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || "/api";
    Promise.all([
      fetch(api + "/posts?size=1").then(r => r.json()).catch(() => ({ totalElements: 0, posts: [] })),
      getCategories().catch(() => []),
      fetch(api + "/notes").then(r => r.json()).catch(() => []),
      fetch(api + "/photos").then(r => r.json()).catch(() => []),
    ]).then(([postData, cats, notes, photos]) => {
      const postList = postData.posts || [];
      setStats({
        posts: postData.totalElements || postList.length,
        categories: Array.isArray(cats) ? cats.length : 0,
        notes: Array.isArray(notes) ? notes.length : 0,
        photos: Array.isArray(photos) ? photos.length : 0,
        lastUpdated: postList.length > 0 ? postList[0].date : "-",
      });
    });
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const loadPosts = useCallback(async (pageNum = 0, append = false) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchPosts({ search: debouncedSearch || undefined, page: pageNum });
      const postList = data.posts || [];
      if (append) {
        setPosts(prev => [...prev, ...postList]);
      } else {
        setPosts(postList);
      }
      setTotalPages(data.totalPages || 1);
      setHasMore(pageNum + 1 < (data.totalPages || 1));
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { setPage(0); loadPosts(0); }, [loadPosts]);

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage, true);
  }

  function handleDeleteClick(slug: string, title: string) {
    setConfirmTarget({ slug, title });
    setConfirmOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!confirmTarget) return;
    setConfirmOpen(false);
    const { slug, title } = confirmTarget;
    setDeleting(slug);
    try {
      await deletePost(slug);
      setPosts((prev) => prev.filter((p) => p.slug !== slug));
      showToast(`已删除「${title}」`, "success");
    } catch (e: any) {
      showToast(e.message || "删除失败", "error");
    } finally {
      setDeleting(null);
      setConfirmTarget(null);
    }
  }

  const statCards = [
    { label: "文章", value: stats.posts, icon: IconPosts, href: "/admin/dashboard", color: "text-blue-400" },
    { label: "分类", value: stats.categories, icon: IconFolder, href: "/admin/categories", color: "text-amber-400" },
    { label: "笔记", value: stats.notes, icon: IconNotes, href: "/admin/notes", color: "text-emerald-400" },
    { label: "相册", value: stats.photos, icon: IconPhoto, href: "/admin/photos", color: "text-pink-400" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">文章管理</h1>
          <p className="text-text-muted text-xs mt-1">共 {stats.posts} 篇文章 · 最后更新 {stats.lastUpdated}</p>
        </div>
        <Link href="/admin/posts/new">
          <AdminButton>
            <IconNew className="w-4 h-4" />
            新建文章
          </AdminButton>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-bg-soft border border-border rounded-xl p-4 hover:border-accent/30 hover:bg-bg-mute transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-muted">{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="text-2xl font-bold text-text-primary">{card.value}</div>
          </Link>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索文章..."
          className="w-full bg-bg-soft border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors outline-none"
        />
      </div>

      {/* Error */}
      {error && (
        <AdminAlert>
          {error}
          <button onClick={() => loadPosts()} className="ml-3 underline hover:opacity-80">重试</button>
        </AdminAlert>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-6"><AdminSkeleton variant="stats" /><AdminSkeleton variant="list" /></div>
      )}

      {/* Empty */}
      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-soft border border-border flex items-center justify-center">
            <IconPosts className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-muted text-sm mb-4">
            {search ? "未找到匹配文章" : "还没有文章，开始创作第一篇吧"}
          </p>
          {!search && (
            <Link href="/admin/posts/new">
              <AdminButton>
                <IconNew className="w-4 h-4" />
                创建第一篇文章
              </AdminButton>
            </Link>
          )}
        </div>
      )}

      {/* Post list — cards */}
      {!loading && posts.length > 0 && (
        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post.slug}
              className="flex items-center gap-4 bg-bg-soft border border-border rounded-xl px-4 py-3 group hover:border-accent/30 transition-colors"
            >
              {/* Title & slug */}
              {/* Thumbnail */}
              {post.coverImage ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0 bg-bg-mute">
                  <img
                    src={post.coverImage.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL || ""}${post.coverImage}` : post.coverImage}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg border border-border shrink-0 bg-bg-mute flex items-center justify-center">
                  <IconPosts className="w-4 h-4 text-text-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Link
                    href={`/admin/posts/${post.slug}/edit`}
                    className="text-sm font-medium text-text-primary hover:text-accent transition-colors truncate"
                  >
                    {post.title}
                  </Link>
                  {post.pinned && <AdminBadge>置顶</AdminBadge>}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-text-muted font-mono">
                  <span>/posts/{post.slug}</span>
                  <span>{post.date}</span>
                  <span>{post.readTime}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="hidden md:flex items-center gap-1 flex-wrap max-w-[200px]">
                {(post.tags || []).slice(0, 3).map((tag) => (
                  <AdminBadge key={tag}>{tag}</AdminBadge>
                ))}
                {(post.tags || []).length > 3 && (
                  <span className="text-[10px] text-text-muted">+{post.tags.length - 3}</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/admin/posts/${post.slug}/edit`}
                  className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40"
                  title="编辑"
                  aria-label="编辑文章"
                >
                  <IconEdit className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => handleDeleteClick(post.slug, post.title)}
                  disabled={deleting === post.slug}
                  className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-red-400/40"
                  title="删除"
                  aria-label="删除文章"
                >
                  <IconTrash className="w-3.5 h-3.5" />
                </button>
                <Link
                  href={`/posts/${post.slug}`}
                  target="_blank"
                  className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-mute transition-colors focus-visible:ring-2 focus-visible:ring-accent/40"
                  title="预览"
                  aria-label="预览文章"
                >
                  <IconExternal className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
      <AdminConfirmDialog
        open={confirmOpen}
        title="确认删除"
        message={confirmTarget ? `确定删除「${confirmTarget.title}」？此操作不可撤销。` : ""}
        confirmLabel="删除"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
      />
    </div>
  );
}
