"use client";

import { useAuth, AuthProvider } from "@/lib/admin/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { IconPosts, IconNotes, IconNew, IconSparkles, IconBg, IconFont, IconSettings, IconContent, IconProject, IconFolder, IconPhoto, IconMoment, IconMusic, IconExternal, IconLogout, AdminToastContainer, AdminBreadcrumb, AdminConfirmDialog } from "@/components/admin/ui";

interface NavGroup {
  label: string;
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; matchPaths?: string[] }[];
}

function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const groups: NavGroup[] = [
    {
      label: "内容",
      items: [
        { href: "/admin/dashboard", label: "文章管理", icon: IconPosts, matchPaths: ["/admin/posts"] },
        { href: "/admin/projects", label: "项目管理", icon: IconProject },
        { href: "/admin/posts/new", label: "新建文章", icon: IconNew },
        { href: "/admin/notes", label: "笔记", icon: IconNotes },
        { href: "/admin/moments", label: "碎碎念", icon: IconMoment },
      ],
    },
    {
      label: "组织",
      items: [
        { href: "/admin/categories", label: "分类管理", icon: IconFolder },
        { href: "/admin/photos", label: "相册管理", icon: IconPhoto },
      ],
    },
    {
      label: "外观",
      items: [
        { href: "/admin/particles", label: "粒子动效", icon: IconSparkles },
        { href: "/admin/background", label: "背景设置", icon: IconBg },
        { href: "/admin/fonts", label: "字体设置", icon: IconFont },
      ],
    },
    {
      label: "系统",
      items: [
        { href: "/admin/settings", label: "站点设置", icon: IconSettings },
        { href: "/admin/content", label: "内容管理", icon: IconContent },
      ],
    },
  ];

  function isActive(link: { href: string; matchPaths?: string[] }): boolean {
    if (pathname === link.href || pathname.startsWith(link.href + "/")) return true;
    if (link.matchPaths) {
      return link.matchPaths.some((p) => pathname.startsWith(p));
    }
    return false;
  }

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-bg-soft border-r border-border flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-border">
        <Link
          href="/admin/dashboard"
          prefetch={false}
          className="flex items-center gap-2 text-text-primary font-semibold tracking-tight"
        >
          <div className="w-6 h-6 rounded-md bg-accent/20 flex items-center justify-center text-accent text-[10px] font-bold">
            D
          </div>
          <span className="text-sm">devlog</span>
          <span className="text-[10px] text-text-muted ml-1">管理</span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-mute"
          aria-label="关闭侧边栏"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Nav links grouped */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label} className="space-y-0.5">
            <div className="px-3 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              {group.label}
            </div>
            {group.items.map((link) => {
              const Icon = link.icon;
              const active = isActive(link);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-mute"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-2.5 py-3 border-t border-border space-y-0.5">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-bg-mute transition-colors"
        >
          <IconExternal className="w-4 h-4" />
          查看博客
        </Link>
        <button
          onClick={() => setLogoutOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <IconLogout className="w-4 h-4" />
          退出登录
        </button>
      </div>
      <AdminConfirmDialog
        open={logoutOpen}
        title="退出登录"
        message="确定要退出管理后台吗？"
        confirmLabel="退出"
        variant="danger"
        onConfirm={() => { setLogoutOpen(false); logout(); }}
        onCancel={() => setLogoutOpen(false)}
      />
    </aside>
  );
}

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AdminToastContainer />
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Mobile hamburger */}
        <div className="lg:hidden flex items-center h-14 px-4 border-b border-border bg-bg-soft sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-mute"
            aria-label="打开菜单"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-text-primary ml-2">devlog 管理</span>
        </div>
        <div key={pathname} className="max-w-6xl mx-auto px-4 lg:px-6 py-6 lg:py-8"><AdminBreadcrumb pathname={pathname} />{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}
