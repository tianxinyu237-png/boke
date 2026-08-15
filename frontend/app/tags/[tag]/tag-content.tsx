"use client";

import { useRouter } from "next/navigation";
import { coverImage } from "@/lib/config";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  date: string;
  readTime: string;
  tags: string[];
}

export default function TagContent({
  tag,
  posts,
}: {
  tag: string;
  posts: Post[];
}) {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto px-4 pt-12 pb-24">
      <header className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
          <span className="text-accent">#</span> {tag}
        </h1>
        <p className="text-text-muted text-sm">共 {posts.length} 篇文章</p>
      </header>

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <div
            key={post.slug}
            onClick={() => (window.location.href = `/posts/${post.slug}`)}
            className="glass-card group flex items-stretch overflow-hidden cursor-pointer hover:border-accent/40"
          >
            {/* Cover thumbnail */}
            <div className="w-24 sm:w-32 shrink-0 overflow-hidden bg-bg-mute">
              <img
                src={post.coverImage || coverImage(post.slug)}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>

            <div className="flex-1 p-3 sm:p-4 flex items-center gap-3 sm:gap-4 min-w-0">
              <time
                dateTime={post.date}
                className="text-xs text-text-muted shrink-0 w-20"
              >
                {new Date(post.date).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
              <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                {post.title}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-6 border-t border-border">
        <span
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors cursor-pointer"
        >
          ← 返回首页
        </span>
      </div>
    </div>
  );
}
