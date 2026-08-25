"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { loadProjectsConfig, type Project } from "@/lib/projects";

export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const reduce = useReducedMotion();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [html, setHtml] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cfg = await loadProjectsConfig();
      const found = cfg.projects.find((p) => p.slug === slug) || null;
      if (cancelled) return;
      setProject(found);
      setLoading(false);
      if (found?.longDesc) {
        try {
          const res = await fetch("/api/render-markdown", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ md: found.longDesc }),
          });
          const data = await res.json();
          if (!cancelled && data.html) setHtml(data.html);
        } catch {
          // 渲染失败则详情页只显示基本内容
        }
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-24">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 bg-bg-mute rounded" />
          <div className="h-8 w-2/3 bg-bg-mute rounded" />
          <div className="h-32 w-full bg-bg-mute rounded-xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-24 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-3">项目不存在</h1>
        <p className="text-sm text-text-muted mb-8">没有找到这个项目,可能已被移除。</p>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          ← 返回全部项目
        </Link>
      </div>
    );
  }

  const isOnline = !!project.url && project.url.startsWith("http");
  const isWip = !isOnline && /进行中|规划|开发中|TODO/i.test(project.desc || "");
  const statusLabel = isOnline ? "线上" : isWip ? "进行中" : "项目";
  const statusClass = isOnline
    ? "bg-emerald-500/15 text-emerald-400"
    : isWip
    ? "bg-amber-500/15 text-amber-400"
    : "bg-accent/10 text-accent";

  const hasGallery = (project.screenshots || []).length > 0;
  const hasFeatures = (project.features || []).length > 0;
  const hasLinks = (project.links || []).length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-12 pb-24">
      <motion.div
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors mb-6"
        >
          ← 全部项目
        </Link>

        {/* 标题区 */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className={`text-[10px] px-2.5 py-1 rounded-full ${statusClass}`}>{statusLabel}</span>
            {project.tags?.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-md text-[10px] bg-bg-mute text-text-muted">
                {t}
              </span>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mb-3 leading-[1.15]">
            {project.name}
          </h1>
          {project.desc && <p className="text-sm text-text-secondary leading-relaxed">{project.desc}</p>}
          {project.url && (
            <a
              href={project.url}
              target={isOnline ? "_blank" : undefined}
              rel={isOnline ? "noopener noreferrer" : undefined}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
            >
              访问项目
              <span aria-hidden>↗</span>
            </a>
          )}
        </header>

        {/* 截图画廊 */}
        {hasGallery && (
          <section className="mb-8">
            <div className={`grid gap-3 ${(project.screenshots || []).length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {(project.screenshots || []).map((src, i) => (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card overflow-hidden group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${project.name} 截图 ${i + 1}`}
                    className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* 详细介绍 */}
        {project.longDesc && (
          <section className="mb-10">
            <article
              className="prose max-w-none text-text-secondary"
              dangerouslySetInnerHTML={{ __html: html || "" }}
            />
          </section>
        )}

        {/* 特性亮点 */}
        {hasFeatures && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-text-primary mb-4">特性亮点</h2>
            <ul className="space-y-2.5">
              {(project.features || []).map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary leading-relaxed">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] shrink-0">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 链接组 */}
        {hasLinks && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-text-primary mb-4">相关链接</h2>
            <div className="flex flex-wrap gap-2.5">
              {(project.links || []).map((l, i) => (
                <a
                  key={i}
                  href={l.url}
                  target={l.url.startsWith("http") ? "_blank" : undefined}
                  rel={l.url.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-bg-soft border border-border text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
                >
                  {l.label} ↗
                </a>
              ))}
            </div>
          </section>
        )}
      </motion.div>
    </div>
  );
}
