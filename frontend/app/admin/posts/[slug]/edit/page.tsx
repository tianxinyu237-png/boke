"use client";

import PostEditor from "@/components/admin/post-editor";
import { fetchPost, updatePost, type PostData } from "@/lib/admin/api";
import { AdminSkeleton } from "@/components/admin/ui";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditPostPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const slug = params.slug;
    if (!slug) return;

    fetchPost(slug)
      .then(setPost)
      .catch((e) => setError(e.message || "加载文章失败"))
      .finally(() => setLoading(false));
  }, [params.slug]);

  const handleSave = async (data: PostData) => {
    await updatePost(params.slug, data);
    router.push("/admin/dashboard");
  };

  if (loading) {
    return (
      <AdminSkeleton variant="editor" />
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 text-sm mb-4">{error || "文章不存在"}</p>
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="text-accent hover:text-accent-muted text-sm transition-colors"
        >
          ← 返回文章列表
        </button>
      </div>
    );
  }

  return <PostEditor mode="edit" initial={post} onSave={handleSave} />;
}
