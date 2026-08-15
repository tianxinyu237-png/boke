"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { getCategories, type CategoryData } from "@/lib/categories";
import PostCard from "@/components/post-card";
import type { Post } from "@/components/post-card";
import ScrollReveal from "@/components/scroll-reveal";

export default function CategoriesContent() {
  const reduce = useReducedMotion();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [catPosts, setCatPosts] = useState<Map<number, Post[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const cats = await getCategories();
      const sorted = cats.sort((a, b) => a.sortOrder - b.sortOrder);
      setCategories(sorted);

      const api = process.env.NEXT_PUBLIC_API_URL || "/api";
      const map = new Map<number, Post[]>();
      for (const cat of cats) {
        try {
          const res = await fetch(`${api}/posts?categoryId=${cat.id}&size=5`);
          const data = await res.json();
          map.set(cat.id, data.posts || []);
        } catch {}
      }
      setCatPosts(map);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-12 pb-24">
      <motion.div
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">分类</h1>
        <p className="text-text-muted text-sm mb-10">按主题浏览文章</p>
      </motion.div>

      {loading ? (
        <p className="text-text-muted text-sm py-8 text-center">加载中...</p>
      ) : (
        <div className="space-y-12">
          {categories.map((cat, ci) => {
            const posts = catPosts.get(cat.id) || [];
            return (
              <motion.section key={cat.id}
                initial={reduce ? {} : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ci * 0.08 }}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-1.5 h-6 rounded-full bg-accent" />
                  <h2 className="text-xl font-bold text-white">{cat.name}</h2>
                  <span className="text-xs text-text-muted">{posts.length} 篇</span>
                </div>
                {cat.description && (
                  <p className="text-sm text-text-secondary mb-4">{cat.description}</p>
                )}
                {posts.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {posts.map((post, i) => (
                      <ScrollReveal key={post.slug} delay={i * 0.03}>
                        <PostCard post={post} />
                      </ScrollReveal>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted py-4">暂无文章</p>
                )}
              </motion.section>
            );
          })}
        </div>
      )}
    </div>
  );
}
