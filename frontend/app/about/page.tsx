"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useSiteConfig } from "@/components/site-config-provider";
import { loadAboutConfig, type AboutConfig, DEFAULT_ABOUT } from "@/lib/about";
import { loadLinksConfig, type LinksConfig, DEFAULT_LINKS } from "@/lib/links";

// Secondary destinations that no longer live in the top nav
const morePages = [
  { href: "/categories", label: "按分类浏览", desc: "文章按分类聚合" },
  { href: "/moments", label: "碎碎念", desc: "短想法和日常" },
  { href: "/gamepad", label: "手柄", desc: "网页手柄测试工具" },
  { href: "/photos", label: "照片", desc: "随手拍的一些画面" },
];

export default function AboutPage() {
  const reduce = useReducedMotion();
  const { config: SITE } = useSiteConfig();
  const [about, setAbout] = useState<AboutConfig>(DEFAULT_ABOUT);
  const [links, setLinks] = useState<LinksConfig>(DEFAULT_LINKS);

  useEffect(() => {
    loadAboutConfig().then(setAbout);
    loadLinksConfig().then(setLinks);
  }, []);

  const fadeUp = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <div className="mx-auto max-w-[1024px] px-5 pt-12 pb-24 sm:px-8">
      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
          关于
        </h1>
        <p className="text-text-muted text-sm mb-10">背后的人和技术栈</p>
      </motion.div>

      {/* Profile section */}
      <motion.div
        className="flex flex-col sm:flex-row items-start gap-6 mb-12"
        initial={reduce ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {SITE.avatarUrl ? (
          <img
            src={SITE.avatarUrl}
            alt={SITE.name}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-accent/20 shadow-xl shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent text-2xl font-bold ring-4 ring-accent/20 shadow-xl shrink-0">
            {SITE.avatar}
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-3">{SITE.name}</h2>
          <p className="text-text-secondary text-sm leading-relaxed max-w-lg">
            {about.bio}
          </p>
          <a
            href="/resume"
            className="inline-flex items-center gap-1.5 mt-4 text-sm text-accent hover:gap-2.5 transition-all"
          >
            查看完整简历
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      </motion.div>

      {/* Tech stack */}
      <motion.section
        className="mb-12"
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-text-primary mb-4">技术栈</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {about.techStack.map((tech) => (
            <div
              key={tech.name}
              className="bg-bg-soft border border-border rounded-xl px-4 py-3"
            >
              <div className="text-sm font-medium text-text-primary">{tech.name}</div>
              <div className="text-xs text-text-muted mt-0.5">{tech.desc}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Contact / Social */}
      <motion.section
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-text-primary mb-4">联系方式</h2>
        <div className="flex flex-wrap gap-3">
          {about.contacts.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={(link.href || "").startsWith("http") ? "_blank" : undefined}
              rel={(link.href || "").startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-soft border border-border text-sm text-text-secondary hover:text-accent hover:border-accent/30 transition-colors"
            >
              {link.icon === "github" && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z" />
                </svg>
              )}
              {link.icon === "email" && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13 2 4" />
                </svg>
              )}
              {link.icon === "rss" && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                  <path d="M4 11a9 9 0 019 9" />
                  <path d="M4 4a16 16 0 0116 16" />
                  <circle cx="5" cy="19" r="1" />
                </svg>
              )}
              {link.label}
            </a>
          ))}
        </div>
      </motion.section>

      {/* 友链 — 从顶部导航移到这里 */}
      {links.friends.length > 0 && (
        <motion.section
          className="mt-12"
          initial={reduce ? {} : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">友链</h2>
            <a
              href="/links"
              className="text-xs text-text-muted hover:text-accent transition-colors"
            >
              全部友链 →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {links.friends.slice(0, 6).map((f) => (
              <a
                key={f.url}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-bg-soft border border-border rounded-xl px-3.5 py-3 hover:border-accent/30 transition-colors"
              >
                {f.avatar ? (
                  <img
                    src={f.avatar}
                    alt={f.name}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center shrink-0">
                    {f.name.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">
                    {f.name}
                  </div>
                  <div className="text-xs text-text-muted truncate">{f.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </motion.section>
      )}

      {/* 更多 — 次要页面入口 */}
      <motion.section
        className="mt-12"
        initial={reduce ? {} : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2 className="text-lg font-semibold text-text-primary mb-4">更多</h2>
        <div className="grid grid-cols-2 gap-2">
          {morePages.map((p) => (
            <a
              key={p.href}
              href={p.href}
              className="bg-bg-soft border border-border rounded-xl px-4 py-3 hover:border-accent/30 transition-colors"
            >
              <div className="text-sm font-medium text-text-primary">{p.label}</div>
              <div className="text-xs text-text-muted mt-0.5">{p.desc}</div>
            </a>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
