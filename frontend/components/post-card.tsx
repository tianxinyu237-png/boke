"use client";

import { motion, useReducedMotion } from "motion/react";
import { coverImage } from "@/lib/config";
import { useSiteConfig } from "@/components/site-config-provider";

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
  category?: { id: number; name: string; slug: string };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function PostCard({ post }: { post: Post }) {
  const { config: site } = useSiteConfig();
  const reduce = useReducedMotion();
  const variants = {
    hidden: reduce ? {} : { opacity: 0, y: 12 },
    visible: reduce ? {} : { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div variants={variants}
      className="glass-card group flex items-stretch overflow-hidden cursor-pointer hover:border-accent/40"
      onClick={() => (window.location.href = "/posts/" + post.slug)}>
      <div className="w-24 sm:w-40 shrink-0 overflow-hidden bg-bg-mute hidden sm:block">
        <img src={post.coverImage || site.defaultCoverImage || coverImage(post.slug)} alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
      </div>
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-3 text-xs text-text-secondary mb-2">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span>·</span>
          <span>{post.readTime}</span>
        </div>
        <h2 className="text-lg font-bold text-white group-hover:text-accent transition-colors mb-1.5 line-clamp-1">
          {post.title}
        </h2>
        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mb-2">{post.excerpt}</p>
        <div className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} onClick={(e) => { e.stopPropagation(); window.location.href = "/tags/" + tag; }}
              className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium text-text-secondary bg-bg-mute hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
