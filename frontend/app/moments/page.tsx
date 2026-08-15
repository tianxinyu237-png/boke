"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";

interface Moment {
  id: number;
  content: string;
  createdAt: string;
}

export default function MomentsPage() {
  const reduce = useReducedMotion();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
    fetch(`${api}/moments`)
      .then((r) => r.json())
      .then(setMoments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-12 pb-24">
      <motion.div
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">碎碎念</h1>
        <p className="text-text-muted text-sm mb-10">
          {loading ? "加载中..." : `共 ${moments.length} 条`}
        </p>
      </motion.div>

      {loading ? (
        <p className="text-text-muted text-sm py-8 text-center">加载中...</p>
      ) : moments.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-muted text-sm">暂无碎碎念</p>
        </div>
      ) : (
        <div className="space-y-4">
          {moments.map((m, i) => (
            <motion.div
              key={m.id}
              initial={reduce ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-bg-soft border border-border rounded-xl p-5"
            >
              <div
                className="text-sm text-text-secondary leading-relaxed"
                dangerouslySetInnerHTML={{ __html: m.content }}
              />
              <div className="mt-3 text-xs text-text-muted">
                {new Date(m.createdAt).toLocaleString("zh-CN", {
                  year: "numeric", month: "long", day: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
