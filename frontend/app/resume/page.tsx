"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useSiteConfig } from "@/components/site-config-provider";
import { loadAboutConfig, type AboutConfig, DEFAULT_ABOUT } from "@/lib/about";
import { loadProjectsConfig, type ProjectsConfig, DEFAULT_PROJECTS } from "@/lib/projects";

export default function ResumePage() {
  const reduce = useReducedMotion();
  const { config: SITE } = useSiteConfig();
  const [about, setAbout] = useState<AboutConfig>(DEFAULT_ABOUT);
  const [projects, setProjects] = useState<ProjectsConfig>(DEFAULT_PROJECTS);

  useEffect(() => {
    loadAboutConfig().then(setAbout);
    loadProjectsConfig().then(setProjects);
  }, []);

  const fadeUp = (delay = 0) =>
    reduce ? {} : {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
    };

  // 按分类分组技术栈
  const categories = Array.from(new Set(about.techStack.map((t) => t.category)));

  return (
    <div className="max-w-3xl mx-auto px-4 pt-12 pb-24">
      {/* Header */}
      <motion.header {...fadeUp(0)}>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          {SITE.name}
        </h1>
        <p className="text-lg text-accent mt-1.5">全能开发程序员</p>
        <p className="text-sm text-text-secondary leading-relaxed mt-3 max-w-xl">
          {about.bio}
        </p>
        <div className="flex flex-wrap gap-2.5 mt-5">
          {about.contacts.map((c) => {
            const url = c.url || c.href || "#";
            return (
            <a
              key={c.label}
              href={url}
              target={url.startsWith("http") ? "_blank" : undefined}
              rel={url.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-bg-soft border border-border text-xs text-text-secondary hover:text-accent hover:border-accent/30 transition-colors"
            >
              {c.label}
            </a>
            );
          })}
        </div>
      </motion.header>

      {/* Tech stack */}
      <motion.section {...fadeUp(0.1)} className="mt-12">
        <h2 className="text-lg font-semibold text-text-primary mb-5 flex items-center gap-2">
          <span className="text-accent">▍</span>技术栈
        </h2>
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat}>
              <div className="text-xs text-text-muted mb-2">{cat}</div>
              <div className="flex flex-wrap gap-2">
                {about.techStack
                  .filter((t) => t.category === cat)
                  .map((t) => (
                    <span
                      key={t.name}
                      className="px-3 py-1.5 rounded-lg bg-bg-soft border border-border text-xs text-text-secondary"
                    >
                      {t.name}
                      {typeof t.level === "number" && (
                        <span className="ml-1.5 text-text-muted text-[10px]">{t.level}%</span>
                      )}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Project timeline */}
      <motion.section {...fadeUp(0.2)} className="mt-12">
        <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
          <span className="text-accent">▍</span>项目经历
        </h2>
        <div className="relative pl-6 border-l border-border">
          {projects.projects.map((p, i) => {
            const isOnline = p.url && p.url.startsWith("http");
            return (
              <motion.div
                key={p.name}
                initial={reduce ? {} : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                className="relative mb-8 last:mb-0"
              >
                {/* Timeline node */}
                <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-accent ring-4 ring-accent/15" />
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-sm font-semibold text-text-primary">{p.name}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      isOnline
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {isOnline ? "线上" : "进行中"}
                  </span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed mb-2">{p.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-md text-[10px] bg-bg-mute text-text-muted">
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Bottom CTA */}
      <motion.div {...fadeUp(0.3)} className="mt-14 glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-text-primary">想了解更多?</div>
          <div className="text-xs text-text-muted mt-1">看项目细节、技术笔记和完整博客</div>
        </div>
        <div className="flex gap-3 shrink-0">
          <a
            href="/projects"
            className="px-5 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/85 transition-colors"
          >
            项目作品集
          </a>
          <a
            href="/"
            className="px-5 py-2 rounded-xl bg-bg-mute text-text-secondary text-sm font-medium hover:text-accent transition-colors"
          >
            回博客首页
          </a>
        </div>
      </motion.div>
    </div>
  );
}
