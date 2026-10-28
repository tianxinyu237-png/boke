"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useSiteConfig } from "@/components/site-config-provider";
import { resolveCover } from "@/lib/cover";

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  coverImage?: string;
  date: string;
  readTime: string;
  tags: string[];
  pinned?: boolean;
  likeCount?: number;
  category?: { id: number; name: string; slug: string };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric", month: "long", day: "numeric",
  });
}

/* 直接从 ISO 字符串取年月日：避免时区导致服务端/客户端渲染不一致（hydration） */
function dateParts(dateStr: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr || "");
  if (m) return { y: m[1], m: m[2], d: m[3] };
  const dt = new Date(dateStr);
  return {
    y: String(dt.getFullYear()),
    m: String(dt.getMonth() + 1).padStart(2, "0"),
    d: String(dt.getDate()).padStart(2, "0"),
  };
}

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];



export default function PostCard({ post }: { post: Post }) {
  const { config: site } = useSiteConfig();
  const reduce = useReducedMotion();
  const dp = dateParts(post.date);
  const cover = resolveCover(post.coverImage, site.defaultCoverImage);
  const variants = {
    hidden: reduce ? {} : { opacity: 0, y: 12 },
    visible: reduce ? {} : { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.article variants={variants}>
      <Link
        href={"/posts/" + post.slug}
        className="glass-card group flex items-stretch overflow-hidden hover:border-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        {cover ? (
          <div className="hidden w-24 shrink-0 overflow-hidden bg-bg-mute sm:block sm:w-40">
            <img
              src={cover}
              alt={post.title}
              width={160}
              height={160}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          /* 无封面：把日期做成版面锚点（大字日 + 月 + 年），比灰块/外链占位图有设计感 */
          <div className="hidden w-24 shrink-0 flex-col items-center justify-center gap-1 border-r border-border bg-gradient-to-br from-accent/[0.14] via-transparent to-accent-secondary/[0.10] sm:flex sm:w-40">
            <span className="font-mono text-[30px] font-semibold leading-none tracking-tight text-accent/90">
              {dp.d}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
              {MONTHS[Number(dp.m) - 1] || dp.m}
            </span>
            <span className="mt-1 h-px w-6 bg-border" />
            <span className="text-[9px] uppercase tracking-[0.14em] text-text-muted/70">
              {dp.y}
            </span>
          </div>
        )}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center min-w-0">
          <div className="mb-2 flex items-center gap-3 text-xs text-text-secondary">
            {cover ? (
              <>
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span>·</span>
              </>
            ) : null}
            <span>{post.readTime}</span>
            {post.category ? (
              <>
                <span>·</span>
                <span className="text-accent/80">{post.category.name}</span>
              </>
            ) : null}
          </div>
          <h2 className="serif-title text-[19px] font-semibold text-text-primary group-hover:text-accent transition-colors mb-1.5 line-clamp-1">
            {post.title}
          </h2>
          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mb-2">{post.excerpt}</p>
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = "/tags/" + tag;
                }}
                className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium text-text-secondary bg-bg-mute hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
