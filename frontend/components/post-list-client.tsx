"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import PostCard from "@/components/post-card";
import ScrollReveal from "@/components/scroll-reveal";
import type { Post } from "@/components/post-card";
import type { PaginatedPosts } from "@/lib/posts";
import { useSiteConfig } from "@/components/site-config-provider";
import type { CategoryData } from "@/lib/categories";

function Hero() {
  const reduce = useReducedMotion();
  const { config: SITE } = useSiteConfig();
  return (
    <section className="pt-16 pb-12 text-center relative">
      <motion.div className="inline-block mb-6"
        initial={reduce ? {} : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
        {SITE.avatarUrl ? (
          <img src={SITE.avatarUrl} alt={SITE.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-accent/20 shadow-xl" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center text-accent text-3xl font-bold ring-4 ring-accent/20 shadow-xl">{SITE.avatar}</div>
        )}
      </motion.div>
      <motion.div className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 leading-[1.1]"
        style={{ background: "linear-gradient(135deg, var(--hero-from), var(--hero-via), var(--hero-to))", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}
        initial={reduce ? {} : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>{SITE.name}</motion.div>
      <motion.p className="text-white text-lg mb-2 max-w-lg mx-auto"
        initial={reduce ? {} : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}>{SITE.description}</motion.p>
      <motion.p className="text-white text-base max-w-md mx-auto leading-relaxed"
        initial={reduce ? {} : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}>{SITE.tagline}</motion.p>
    </section>
  );
}

function CategorySection({ category, posts }: { category: CategoryData; posts: Post[] }) {
  const reduce = useReducedMotion();
  if (posts.length === 0) return null;
  return (
    <section className="mb-12">
      <motion.div className="flex items-center justify-between mb-5"
        initial={reduce ? {} : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-accent inline-block" />
          {category.name}
        </h2>
        <a href={`/categories`} className="text-xs text-white hover:text-accent hover:underline transition-colors">
          查看更多 →
        </a>
      </motion.div>
      <div className="flex flex-col gap-3">
        {posts.slice(0, 3).map((post, i) => (
          <ScrollReveal key={post.slug} delay={i * 0.04}>
            <PostCard post={post} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

export function PostListClient({ initialData, categories: serverCategories }: { initialData: PaginatedPosts; categories: CategoryData[] }) {
  const [posts] = useState<Post[]>(initialData.posts);
  const [categories, setCategories] = useState<CategoryData[]>(serverCategories);

  // Load categories client-side if SSR didn't provide them
  useEffect(() => {
    if (!categories || categories.length === 0) {
      import("@/lib/categories").then(m => m.getCategories().then(c => setCategories(c.sort((a,b) => a.sortOrder - b.sortOrder))));
    }
  }, []);
  const totalElements = initialData.totalElements;
  const reduce = useReducedMotion();

  // Group posts by category
  const { categorizedPosts, uncategorizedPosts } = useMemo(() => {
    const catMap = new Map<number, Post[]>();
    const uncat: Post[] = [];
    const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    
    for (const post of posts) {
      if (post.category?.id && sortedCategories.some(c => c.id === post.category!.id)) {
        const arr = catMap.get(post.category.id) || [];
        arr.push(post);
        catMap.set(post.category.id, arr);
      } else {
        uncat.push(post);
      }
    }
    return { categorizedPosts: sortedCategories.map(c => ({ category: c, posts: catMap.get(c.id) || [] })), uncategorizedPosts: uncat };
  }, [posts, categories]);

  return (
    <>
      <Hero />

      {posts.length === 0 ? (
        <p className="text-text-muted py-16 text-center text-sm">暂无文章。</p>
      ) : (
        <>
          {/* Category sections */}
          {categorizedPosts.map(({ category, posts }) => (
            <CategorySection key={category.id} category={category} posts={posts} />
          ))}

          {/* Uncategorized posts */}
          {uncategorizedPosts.length > 0 && (
            <section className="mb-12">
              <motion.div className="mb-5"
                initial={reduce ? {} : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-text-muted inline-block" />
                  最新文章
                </h2>
              </motion.div>
              <div className="flex flex-col gap-3">
                {uncategorizedPosts.map((post, i) => (
                  <ScrollReveal key={post.slug} delay={i * 0.04}>
                    <PostCard post={post} />
                  </ScrollReveal>
                ))}
              </div>
            </section>
          )}

          {/* Total count */}
          <div className="mt-4 text-center">
            <p className="text-text-muted text-xs">共 {totalElements} 篇文章</p>
          </div>
        </>
      )}
    </>
  );
}
