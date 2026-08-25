"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { loadProjectsConfig, type ProjectsConfig, DEFAULT_PROJECTS } from "@/lib/projects";

export default function FeaturedProjects() {
  const reduce = useReducedMotion();
  const [cfg, setCfg] = useState<ProjectsConfig>(DEFAULT_PROJECTS);

  useEffect(() => {
    loadProjectsConfig().then(setCfg);
  }, []);

  const featured = cfg.projects.slice(0, 3);

  return (
    <section className="max-w-3xl mx-auto px-4 pt-16">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">精选项目</h2>
          <p className="text-xs text-text-muted mt-1">做过的、在做的、上线跑着的</p>
        </div>
        <a
          href="/projects"
          className="text-xs text-text-muted hover:text-accent transition-colors shrink-0"
        >
          全部项目 →
        </a>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {featured.map((p, i) => {
          const detailPath = p.slug ? `/projects/${p.slug}` : null;
          const href = detailPath ?? p.url ?? "/projects";
          const external = !detailPath && p.url?.startsWith("http");
          return (
          <motion.a
            key={p.name}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            initial={reduce ? {} : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card block p-5 hover:border-accent/40 group h-full"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xl">{["🚀", "🎙️", "⚙️"][i] || "📦"}</span>
              {p.tags?.[0] && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                  {p.tags[0]}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors mb-1.5">
              {p.name}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
              {p.desc}
            </p>
            {detailPath && (
              <div className="mt-2.5 text-[10px] text-text-muted group-hover:text-accent transition-colors">
                查看详情 →
              </div>
            )}
          </motion.a>
          );
        })}
      </div>
    </section>
  );
}
