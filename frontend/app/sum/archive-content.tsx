"use client";

import { useState } from "react";
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

export default function ArchiveContent({ posts }: { posts: Post[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags || []))).sort();
  const visible = activeTag
    ? posts.filter((p) => (p.tags || []).includes(activeTag))
    : posts;

  const byYear: Record<string, Post[]> = {};
  for (const post of visible) {
    const year = new Date(post.date).getFullYear().toString();
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(post);
  }

  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="max-w-3xl mx-auto px-4 pt-12 pb-24">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          文章
        </h1>
        <p className="text-text-muted text-sm mt-2">
          共 {posts.length} 篇{activeTag ? `,当前筛选 ${visible.length} 篇` : ""}
        </p>
      </header>

      {/* Tag filter — replaces the separate /categories entry in the nav */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors border ${
              activeTag === null
                ? "bg-accent/15 text-accent border-accent/40"
                : "bg-bg-soft text-text-muted border-border hover:text-accent hover:border-accent/30"
            }`}
          >
            全部
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors border ${
                activeTag === tag
                  ? "bg-accent/15 text-accent border-accent/40"
                  : "bg-bg-soft text-text-muted border-border hover:text-accent hover:border-accent/30"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {years.map((year) => (
          <section key={year}>
            <h2 className="text-sm font-semibold text-text-muted mb-4 flex items-center gap-3">
              <span className="text-base font-bold text-accent">{year}</span>
              <span className="h-px flex-1 bg-border" />
            </h2>

            <div className="flex flex-col gap-3">
              {byYear[year].map((post) => (
                <div
                  key={post.slug}
                  onClick={() => (window.location.href = `/posts/${post.slug}`)}
                  className="glass-card group flex items-stretch overflow-hidden cursor-pointer hover:border-accent/40"
                >
                  {/* Cover thumbnail — fixed width, no mask */}
                  <div className="w-24 sm:w-32 shrink-0 overflow-hidden bg-bg-mute">
                    <img
                      src={post.coverImage || coverImage(post.slug)}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-3 sm:p-4 flex items-center gap-3 sm:gap-4 min-w-0">
                    <time
                      dateTime={post.date}
                      className="text-xs text-text-muted shrink-0 text-right leading-tight"
                    >
                      <span className="block text-[11px]">
                        {new Date(post.date).toLocaleDateString("zh-CN", {
                          month: "short",
                        })}
                      </span>
                      <span className="block text-sm font-mono text-text-secondary">
                        {new Date(post.date).getDate()}
                      </span>
                    </time>
                    <span className="text-sm sm:text-base font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                      {post.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
