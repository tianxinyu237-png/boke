"use client";

import { motion, useReducedMotion } from "motion/react";
import PostCard from "@/components/post-card";
import ScrollReveal from "@/components/scroll-reveal";
import type { Post } from "@/components/post-card";
import { SITE, HERO_GRADIENT } from "@/lib/config";

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="pt-16 pb-12 text-center relative">
      {/* Avatar */}
      <motion.div
        className="inline-block mb-6"
        initial={reduce ? {} : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {SITE.avatarUrl ? (
          <img
            src={SITE.avatarUrl}
            alt={SITE.name}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-accent/20 shadow-xl"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center text-accent text-3xl font-bold ring-4 ring-accent/20 shadow-xl">
            {SITE.avatar}
          </div>
        )}
      </motion.div>

      {/* Name — gradient text */}
      <motion.h1
        className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 leading-[1.1]"
        style={{
          background: `linear-gradient(135deg, ${HERO_GRADIENT.from}, ${HERO_GRADIENT.via}, ${HERO_GRADIENT.to})`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {SITE.name}
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="text-text-secondary text-base mb-2 max-w-lg mx-auto"
        initial={reduce ? {} : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {SITE.description}
      </motion.p>

      {/* Bio */}
      <motion.p
        className="text-text-muted text-sm max-w-md mx-auto leading-relaxed"
        initial={reduce ? {} : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {SITE.tagline}
      </motion.p>
    </section>
  );
}

export function PostList({ posts }: { posts: Post[] }) {
  const reduce = useReducedMotion();

  if (posts.length === 0) {
    return (
      <motion.p
        className="text-text-muted py-16 text-center text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        暂无文章。
      </motion.p>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial="hidden"
      animate="visible"
      variants={
        reduce
          ? undefined
          : { visible: { transition: { staggerChildren: 0.06 } } }
      }
    >
      {posts.map((post, i) => (
        <ScrollReveal key={post.slug} delay={i * 0.04}>
          <PostCard post={post} />
        </ScrollReveal>
      ))}
    </motion.div>
  );
}
