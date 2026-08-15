"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Post } from "@/components/post-card";
import { ScrollProgress, BackToTop } from "@/components/article-tools";
import { useHeadings, TableOfContents } from "@/components/table-of-contents";
import CommentSection from "@/components/comment-section";
import { useCodeCopy } from "@/components/code-copy";
import { useMermaid } from "@/components/mermaid-loader";

export function ArticleView({
  post,
  prevPost,
  nextPost,
}: {
  post: Post & { content?: string };
  prevPost?: (Post & { content?: string }) | null;
  nextPost?: (Post & { content?: string }) | null;
}) {
  const reduce = useReducedMotion();
  const { headings, activeId } = useHeadings("article-content");
  useCodeCopy("article-content");
  useMermaid("article-content");

  const fadeUp = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
      };

  return (
    <>
      <ScrollProgress />

      <div className="max-w-6xl mx-auto px-4 pt-12 pb-24 flex gap-16">
        {/* Main content */}
        <article className="flex-1 min-w-0">
          <header className="mb-12">
            <motion.div
              className="flex items-center gap-3 text-xs text-text-muted mb-5"
              {...fadeUp}
            >
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span>·</span>
              <span>{post.readTime}</span>
            </motion.div>

            <motion.h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-text-primary mb-8 leading-[1.15]"
              {...fadeUp}
              transition={{
                duration: 0.7,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {post.title}
            </motion.h1>

            <motion.div
              className="flex flex-wrap gap-2"
              initial={reduce ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  onClick={() => (window.location.href = `/tags/${tag}`)}
                  className="inline-block px-3 py-1 rounded-lg text-xs font-medium bg-bg-mute text-text-muted hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          </header>

          <motion.div
            id="article-content"
            className="prose max-w-none"
            initial={reduce ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
          />

          <motion.div
            className="mt-16 pt-8 border-t border-border"
            initial={reduce ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center justify-between gap-4">
              {prevPost ? (
                <div
                  onClick={() => (window.location.href = `/posts/${prevPost.slug}`)}
                  className="flex-1 min-w-0 group cursor-pointer"
                >
                  <span className="text-xs text-text-muted mb-1 block">← 上一篇</span>
                  <span className="text-sm text-text-secondary group-hover:text-accent transition-colors line-clamp-1">
                    {prevPost.title}
                  </span>
                </div>
              ) : (
                <div className="flex-1" />
              )}

              {nextPost ? (
                <div
                  onClick={() => (window.location.href = `/posts/${nextPost.slug}`)}
                  className="flex-1 min-w-0 text-right group cursor-pointer"
                >
                  <span className="text-xs text-text-muted mb-1 block">下一篇 →</span>
                  <span className="text-sm text-text-secondary group-hover:text-accent transition-colors line-clamp-1">
                    {nextPost.title}
                  </span>
                </div>
              ) : (
                <div className="flex-1" />
              )}
            </div>

            <div className="mt-8">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors group"
              >
                <svg
                  width="16" height="16" viewBox="0 0 16 16"
                  fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  className="group-hover:-translate-x-1 transition-transform duration-200"
                >
                  <path d="M10 3L5 8l5 5" />
                </svg>
                返回首页
              </a>
            </div>
          </motion.div>
          <CommentSection />
        </article>

        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24">
            <TableOfContents headings={headings} activeId={activeId} />
          </div>
        </aside>
      </div>

      <BackToTop />
    </>
  );
}
