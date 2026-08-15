"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { loadProjectsConfig, type ProjectsConfig, DEFAULT_PROJECTS } from "@/lib/projects";

export default function ProjectsPage() {
  const reduce = useReducedMotion();
  const [cfg, setCfg] = useState<ProjectsConfig>(DEFAULT_PROJECTS);

  useEffect(() => {
    loadProjectsConfig().then(setCfg);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-12 pb-24">
      <motion.div
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">项目</h1>
        <p className="text-text-muted text-sm mb-10">开源项目与技术实践</p>
      </motion.div>

      <div className="space-y-4">
        {cfg.projects.map((p, i) => (
          <motion.a
            key={p.name}
            href={p.url || "#"}
            target={p.url?.startsWith("http") ? "_blank" : undefined}
            rel={p.url?.startsWith("http") ? "noopener noreferrer" : undefined}
            initial={reduce ? {} : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card block p-5 hover:border-accent/40 group"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
                {p.name}
              </h3>
              {p.stars && (
                <span className="text-xs text-text-muted flex items-center gap-1 shrink-0">
                  ⭐ {p.stars}
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary mb-3">{p.desc}</p>
            <div className="flex flex-wrap gap-1.5">
              {p.tags.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-md text-[10px] bg-bg-mute text-text-muted">
                  {t}
                </span>
              ))}
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
