"use client";

import { useState } from "react";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  date: string;
  readTime: string;
  tags: string[];
  pinned?: boolean;
  category?: { id: number; name: string; slug: string } | null;
}

/* 直接从 ISO 串取年月日，避免时区导致 SSR/CSR 渲染不一致 */
function parts(dateStr: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr || "");
  if (m) return { y: m[1], m: m[2], d: m[3] };
  const dt = new Date(dateStr);
  return {
    y: String(dt.getFullYear()),
    m: String(dt.getMonth() + 1).padStart(2, "0"),
    d: String(dt.getDate()).padStart(2, "0"),
  };
}

/* ── 文章归档页 ──
   参考 blog.liveout.cn/sum 的编辑式索引：
     · 页头：英文小字大写 + 中文大标题（霞鹜文楷）
     · 顶部全局检索
     · SELECTED 置顶区（三列，带 01/02/03 编号）
     · ALL ARTICLES 按年份分组，每年一个 h3 + 篇数
     · 条目 4 列：月.日（等宽小字）/ 标题 / 分类，行高约 58px
   刻意不用卡片、不用封面图 —— 索引页的价值是密度和可扫读。 */
export default function ArchiveContent({ posts }: { posts: Post[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags || []))).sort();
  const visible = activeTag
    ? posts.filter((p) => (p.tags || []).includes(activeTag))
    : posts;

  const pinnedPosts = visible.filter((p) => p.pinned).slice(0, 3);
  const rest = visible.filter((p) => !p.pinned);

  const byYear: Record<string, Post[]> = {};
  for (const post of rest) {
    const y = parts(post.date).y;
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(post);
  }
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="mx-auto max-w-[1024px] px-5 pt-12 pb-24 sm:px-8">
      {/* ── 页头 ── */}
      <header>
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-text-muted">
          Archive / Article Index
        </p>
        <h1 className="mt-3 font-wenkai text-[clamp(30px,4.6vw,44px)] leading-[1.1] tracking-[-0.02em] text-text-primary">
          文章
        </h1>
        <p className="mt-3 text-[13px] text-text-muted">
          共 {posts.length} 篇 · 按年份归档
          {activeTag ? ` · 当前筛选 ${visible.length} 篇` : ""}
        </p>
      </header>

      {/* ── 全局检索 ── */}
      <form action="/search" method="get" className="mt-8 flex gap-2">
        <input
          type="search"
          name="q"
          placeholder="输入关键词，开始检索全站内容"
          className="min-w-0 flex-1 rounded-xl border border-border bg-bg-soft/60 px-4 py-2.5 text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent/50"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl border border-border bg-bg-soft/60 px-5 py-2.5 text-[13px] text-text-secondary transition-colors hover:border-accent/40 hover:text-accent"
        >
          搜索
        </button>
      </form>

      {/* ── SELECTED 置顶 ── */}
      {pinnedPosts.length > 0 ? (
        <section className="mt-14">
          <header className="border-b border-border pb-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-text-muted">
              Selected
            </p>
            <h2 className="mt-1.5 font-wenkai text-[26px] leading-tight text-text-primary">
              置顶文章
            </h2>
          </header>

          <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {pinnedPosts.map((post, i) => {
              const d = parts(post.date);
              return (
                <a
                  key={post.id}
                  href={`/posts/${post.slug}`}
                  className="group grid grid-cols-[auto_1fr] gap-x-4 border-b border-border/50 py-5"
                >
                  <span className="font-mono text-[12px] leading-relaxed text-accent/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-text-muted">
                      Pinned
                      {post.category?.name ? (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span className="normal-case tracking-normal text-accent/80">
                            {post.category.name}
                          </span>
                        </>
                      ) : null}
                    </p>
                    <h3 className="mt-1.5 font-wenkai text-[17px] leading-snug text-text-primary transition-colors group-hover:text-accent">
                      {post.title}
                    </h3>
                    <time
                      dateTime={post.date}
                      className="mt-1.5 block font-mono text-[11px] text-text-muted"
                    >
                      {d.y}.{d.m}.{d.d}
                    </time>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ── ALL ARTICLES ── */}
      <section className="mt-14">
        <header className="border-b border-border pb-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-text-muted">
            All Articles
          </p>
          <h2 className="mt-1.5 font-wenkai text-[26px] leading-tight text-text-primary">
            全部文章
          </h2>
        </header>

        {years.length === 0 ? (
          <p className="py-10 text-[13px] text-text-muted">这个筛选下还没有文章。</p>
        ) : null}

        {years.map((year) => (
          <div key={year} className="mt-9">
            {/* 年份 + 篇数 + 分隔线 */}
            <div className="flex items-baseline gap-3">
              <h3 className="font-mono text-[19px] font-semibold tracking-tight text-text-primary">
                {year}
              </h3>
              <span className="text-[11px] text-text-muted">
                {String(byYear[year].length).padStart(2, "0")} 篇
              </span>
              <span className="h-px flex-1 bg-border/60" />
            </div>

            <ol className="mt-1">
              {byYear[year].map((post) => {
                const d = parts(post.date);
                return (
                  <li key={post.id}>
                    <a
                      href={`/posts/${post.slug}`}
                      className="group grid grid-cols-[38px_1fr_auto] items-baseline gap-x-4 border-b border-border/40 py-3.5 transition-colors hover:border-accent/30 sm:grid-cols-[46px_1fr_auto]"
                    >
                      <time
                        dateTime={post.date}
                        className="font-mono text-[11.5px] text-text-muted"
                      >
                        {d.m}.{d.d}
                      </time>
                      <h4 className="min-w-0 font-wenkai text-[15.5px] leading-snug text-text-primary transition-colors group-hover:text-accent">
                        {post.title}
                      </h4>
                      {post.category?.name ? (
                        <span className="shrink-0 text-[11px] text-accent/70">
                          {post.category.name}
                        </span>
                      ) : (
                        <span className="w-0" />
                      )}
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </section>

      {/* ── 按标签筛选（保留原有功能）── */}
      {allTags.length > 0 ? (
        <div className="mt-14">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
            按标签筛选
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTag(null)}
              className={`rounded-lg border px-3 py-1.5 text-[11.5px] transition-colors ${
                activeTag === null
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-border bg-bg-soft/60 text-text-muted hover:border-accent/30 hover:text-accent"
              }`}
            >
              全部
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`rounded-lg border px-3 py-1.5 text-[11.5px] transition-colors ${
                  activeTag === tag
                    ? "border-accent/40 bg-accent/15 text-accent"
                    : "border-border bg-bg-soft/60 text-text-muted hover:border-accent/30 hover:text-accent"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
