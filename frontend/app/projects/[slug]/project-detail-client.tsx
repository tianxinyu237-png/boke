"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import type { Project } from "@/lib/projects";

export default function ProjectDetailClient({
  project,
  html,
}: {
  project: Project;
  html: string;
}) {
  const reduce = useReducedMotion();
  const [body, setBody] = useState(html);

  // Render the markdown body on the client when the server didn't provide it.
  useEffect(() => {
    if (body || !project.longDesc) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/render-markdown", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ md: project.longDesc }),
        });
        const data = await res.json();
        if (!cancelled && data.html) setBody(data.html);
      } catch {
        // keep basic info only
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [body, project.longDesc]);

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
    <div className="mx-auto max-w-[1024px] px-5 pt-12 pb-24 sm:px-8">
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
                    decoding="async"
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
              dangerouslySetInnerHTML={{ __html: body || "" }}
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
