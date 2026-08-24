"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion } from "motion/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSiteConfig } from "@/components/site-config-provider";
import { SITE as SITE_STATIC } from "@/lib/config";
import VisitorStats from "@/components/visitor-stats";
import type { ReactNode } from "react";

const navLinks = [
  { href: "/", label: "首页", icon: "house" },
  { href: "/sum", label: "归档", icon: "box-archive" },
  { href: "/categories", label: "分类", icon: "folder" },
  { href: "/projects", label: "项目", icon: "code" },
  { href: "/notes", label: "笔记", icon: "book" },
  { href: "/links", label: "友链", icon: "link" },
  { href: "/moments", label: "碎碎念", icon: "chat" },
  { href: "/resume", label: "简历", icon: "file-text" },
  { href: "/about", label: "关于", icon: "user" },
  { href: "/search", label: "搜索", icon: "magnifying-glass" },
];

function NavIcon({ name }: { name: string }) {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      {name === "house" && (
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      )}
      {name === "box-archive" && (
        <>
          <path d="M21 8v13H3V8" />
          <path d="M1 3h22v5H1z" />
          <path d="M10 12h4" />
        </>
      )}
      {name === "magnifying-glass" && (
        <>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.3-4.3" />
        </>
      )}
      {name === "rss" && (
        <>
          <path d="M4 11a9 9 0 019 9" />
          <path d="M4 4a16 16 0 0116 16" />
          <circle cx="5" cy="19" r="1" />
        </>
      )}
      {name === "book" && (
        <>
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
          <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
        </>
      )}
      {name === "user" && (
        <>
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      )}
      {name === "folder" && (
        <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      )}
      {name === "link" && (
        <>
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </>
      )}
      {name === "chat" && (
        <>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </>
      )}
      {name === "code" && (
        <>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </>
      )}
      {name === "file-text" && (
        <>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </>
      )}
    </svg>
  );
}

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <a
      href={href}
      className={`relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
        isActive
          ? "text-accent bg-accent/8 font-medium"
          : "text-white hover:bg-white/10"
      }`}
    >
      <NavIcon name={icon} />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}

export default function BlogShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { config: SITE } = useSiteConfig();

  // 全局 canonical(SEO): 所有页面统一指向 https://tianxinyv.top{path}
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = `https://tianxinyv.top${pathname}`;
  }, [pathname]);

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="page-gradient" />

      <header className="sticky top-0 z-50">
        <div
          className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between"
          style={{
            backdropFilter: "saturate(180%) blur(20px)",
            WebkitBackdropFilter: "saturate(180%) blur(20px)",
            background: `rgb(var(--color-bg) / 0.72)`,
            borderBottom: `1px solid rgb(var(--color-border) / var(--color-border-alpha))`,
          }}
        >
          <motion.a
            href="/"
            className="flex items-center gap-2.5 text-white font-semibold tracking-tight"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {SITE.avatarUrl ? (
              <img
                src={SITE.avatarUrl}
                alt={SITE.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-accent/20"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px] font-bold">
                {SITE.avatar}
              </div>
            )}
            <span className="text-sm sm:text-base">{SITE.name}</span>
          </motion.a>

          <nav className="flex items-center gap-0 sm:gap-1 overflow-x-auto no-scrollbar min-w-0">
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
            <div className="ml-1 sm:ml-2">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 content-area">{children}</main>

      <footer className="border-t border-border mt-24">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-text-muted">
          <span>{SITE.name} &copy; {new Date().getFullYear()}</span>
          <VisitorStats />
          <span>已运行 {Math.ceil((Date.now() - new Date(SITE.founded || SITE_STATIC.founded).getTime()) / 86400000)} 天</span>
        </div>
      </footer>
    </>
  );
}
