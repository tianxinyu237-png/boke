"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchPosts, type PostData } from "@/lib/admin/api";
import { motion, useReducedMotion } from "motion/react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const reduce = useReducedMotion();

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const data = await fetchPosts({ search: q.trim() });
      setResults(data.posts || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <div className="max-w-3xl mx-auto px-6 pt-16 pb-24">
      <motion.div
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-2">
          搜索
        </h1>
        <p className="text-text-muted text-sm mb-8">
          按标题或内容搜索所有文章。
        </p>

        <div className="relative mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索文章..."
            autoFocus
            className="w-full bg-surface-elevated border border-border rounded-xl px-5 py-3.5 text-text-primary text-base placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          />
          {loading && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-xs">
              搜索中...
            </span>
          )}
        </div>
      </motion.div>

      {/* Results */}
      {searched && (
        <motion.div
          initial={reduce ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {results.length === 0 && !loading && (
            <p className="text-text-muted text-sm py-12 text-center">
              未找到与「{query}」相关的结果
            </p>
          )}

          {results.length > 0 && (
            <>
              <p className="text-text-muted text-xs mb-4">
                共 {results.length} 篇结果
              </p>
              <div className="divide-y divide-border/50">
                {results.map((post) => (
                  <a
                    key={post.slug}
                    href={`/posts/${post.slug}`}
                    onClick={(e) => { e.preventDefault(); window.location.href = `/posts/${post.slug}`; }}
                    className="block py-5 group"
                  >
                    <div className="flex items-center gap-3 text-xs text-text-muted font-mono mb-1.5">
                      <time>{post.date}</time>
                      <span>/</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors mb-1">
                      {post.title}
                    </h3>
                    <p className="text-text-secondary text-sm line-clamp-1">
                      {post.excerpt}
                    </p>
                  </a>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
