"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";

interface Photo {
  id: number;
  url: string;
  title?: string;
  description?: string;
}

export default function PhotosPage() {
  const reduce = useReducedMotion();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || "/api";
    fetch(api + "/photos")
      .then((r) => r.json())
      .then(setPhotos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-12 pb-24">
      <motion.div
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">相册</h1>
        <p className="text-text-muted text-sm mb-10">
          {loading ? "加载中..." : `共 ${photos.length} 张`}
        </p>
      </motion.div>

      {loading ? (
        <p className="text-text-muted text-sm py-8 text-center">加载中...</p>
      ) : photos.length === 0 ? (
        <p className="text-text-muted text-sm py-16 text-center">暂无照片</p>
      ) : (
        <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={reduce ? {} : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="break-inside-avoid rounded-xl overflow-hidden border border-border hover:border-accent/40 transition-colors group cursor-pointer"
            >
              <img
                src={photo.url}
                alt={photo.title || ""}
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {photo.title && (
                <div className="p-3 bg-bg-soft">
                  <p className="text-xs font-medium text-text-primary">{photo.title}</p>
                  {photo.description && (
                    <p className="text-[10px] text-text-muted mt-0.5">{photo.description}</p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
