import { useState, useEffect, type ReactNode } from "react";

// ── Icons ──

export function IconPosts({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

export function IconNotes({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  );
}

export function IconNew({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function IconSparkles({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
    </svg>
  );
}

export function IconBg({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

export function IconFont({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

export function IconSettings({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

export function IconProject({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

export function IconVisitors({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" />
      <path d="M4 6h.01" />
      <path d="M2.29 9.62a10 10 0 1 0 19.02-1.27" />
      <path d="M16.24 7.76a6 6 0 1 0-8.01 8.91" />
      <path d="M12 18h.01" />
      <path d="M17.99 11.66a6 6 0 0 1-2.22 4.9" />
      <circle cx="12" cy="12" r="2" />
      <path d="m13.41 10.59 5.66-5.66" />
    </svg>
  );
}

export function IconContent({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function IconFolder({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}

export function IconPhoto({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}


export function IconMusic({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export function IconMoment({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

export function IconExternal({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function IconLogout({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function IconTrash({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

export function IconEdit({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function IconSearch({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

// ── Form components ──

export function AdminInput({ label, id, ...props }: { label: string; id?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id || label} className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
      <input id={id || label} {...props} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none" />
    </div>
  );
}

export function AdminTextarea({ label, id, ...props }: { label: string; id?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label htmlFor={id || label} className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
      <textarea id={id || label} {...props} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none" />
    </div>
  );
}

export function AdminButton({ children, variant = "primary", ...props }: { children: ReactNode; variant?: "primary" | "secondary" | "danger" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: "bg-accent hover:bg-accent/80 text-white",
    secondary: "bg-bg-mute hover:bg-bg-soft text-text-secondary border border-border",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20",
  };
  return (
    <button {...props} className={`inline-flex items-center gap-1.5 font-medium rounded-lg px-3.5 py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${props.className || ""}`}>
      {children}
    </button>
  );
}

export function AdminBadge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-accent/10 text-accent ${className}`}>
      {children}
    </span>
  );
}

export function AdminAlert({ type = "error", children }: { type?: "error" | "success"; children: ReactNode }) {
  const styles = {
    error: "bg-red-500/10 border-red-500/20 text-red-400",
    success: "bg-green-500/10 border-green-500/20 text-green-400",
  };
  return (
    <div className={`border rounded-lg px-4 py-3 text-sm mb-4 ${styles[type]}`}>
      {children}
    </div>
  );
}

// ── Toast notification ──

export interface ToastData {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

let toastId = 0;
let toastListeners: Array<(toasts: ToastData[]) => void> = [];
let currentToasts: ToastData[] = [];

export function showToast(message: string, type: "success" | "error" | "info" = "info") {
  const id = ++toastId;
  currentToasts = [...currentToasts, { id, message, type }];
  toastListeners.forEach((fn) => fn(currentToasts));
  setTimeout(() => {
    currentToasts = currentToasts.filter((t) => t.id !== id);
    toastListeners.forEach((fn) => fn(currentToasts));
  }, 3000);
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastData[]>(currentToasts);
  useEffect(() => {
    toastListeners.push(setToasts);
    return () => { toastListeners = toastListeners.filter((fn) => fn !== setToasts); };
  }, []);
  return toasts;
}

export function AdminToastContainer() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-[slideUp_0.3s_ease-out] border ${
            t.type === "success"
              ? "bg-green-500/90 border-green-400/30 text-white"
              : t.type === "error"
              ? "bg-red-500/90 border-red-400/30 text-white"
              : "bg-bg-soft border-border text-text-primary"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Confirm dialog ──

export function AdminConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "确认",
  cancelLabel = "取消",
  variant = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="bg-bg-soft border border-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <AdminButton variant="secondary" onClick={onCancel}>{cancelLabel}</AdminButton>
          <AdminButton variant={variant} onClick={onConfirm}>{confirmLabel}</AdminButton>
        </div>
      </div>
    </div>
  );
}

// ── Breadcrumb ──

const BREADCRUMB_MAP: Record<string, string> = {
  "/admin/dashboard": "文章管理",
  "/admin/notes": "笔记管理",
  "/admin/posts": "文章编辑",
  "/admin/particles": "粒子动效",
  "/admin/background": "背景设置",
  "/admin/fonts": "字体设置",
  "/admin/settings": "站点设置",
  "/admin/content": "内容管理",
  "/admin/visitors": "访客统计",
  "/admin/projects": "项目管理",
  "/admin/categories": "分类管理",
  "/admin/photos": "相册管理",
  "/admin/moments": "碎碎念",
};

export function AdminBreadcrumb({ pathname }: { pathname: string }) {
  // Skip breadcrumb on dashboard and login
  if (pathname === "/admin" || pathname === "/admin/dashboard") return null;

  const segments: { label: string; href?: string }[] = [
    { label: "管理后台", href: "/admin/dashboard" },
  ];

  // Find matching breadcrumb
  let matched = "";
  for (const [prefix, label] of Object.entries(BREADCRUMB_MAP)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      matched = prefix;
      segments.push({ label, href: pathname === prefix ? undefined : prefix });
      break;
    }
  }

  // For edit pages, add the "编辑" suffix
  if (pathname.includes("/edit") || pathname.includes("/new")) {
    segments.push({ label: pathname.includes("/new") ? "新建" : "编辑" });
  }

  return (
    <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-4" aria-label="面包屑导航">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
          {seg.href ? (
            <a href={seg.href} className="hover:text-text-secondary transition-colors">{seg.label}</a>
          ) : (
            <span className="text-text-secondary font-medium">{seg.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ── Skeleton loading ──

function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`rounded-md bg-bg-mute animate-pulse ${className}`} />;
}

export function AdminSkeleton({ variant = "card" }: { variant?: "card" | "list" | "stats" | "form" | "editor" }) {
  if (variant === "stats") {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-bg-soft border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <SkeletonBar className="h-3 w-12" />
              <SkeletonBar className="h-4 w-4 rounded" />
            </div>
            <SkeletonBar className="h-7 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-bg-soft border border-border rounded-xl px-4 py-3 flex items-center gap-4">
            <SkeletonBar className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <SkeletonBar className="h-4 w-1/3" />
              <SkeletonBar className="h-3 w-1/2" />
            </div>
            <SkeletonBar className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className="space-y-6">
        <SkeletonBar className="h-6 w-32" />
        <div className="bg-bg-soft border border-border rounded-xl p-5 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-1.5">
              <SkeletonBar className="h-3 w-16" />
              <SkeletonBar className="h-9 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "editor") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <SkeletonBar className="h-6 w-32" />
            <SkeletonBar className="h-3 w-48" />
          </div>
        </div>
        <div className="bg-bg-soft border border-border rounded-2xl p-6 space-y-4">
          <SkeletonBar className="h-9 w-full" />
          <SkeletonBar className="h-9 w-2/3" />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonBar className="h-9 w-full" />
            <SkeletonBar className="h-9 w-full" />
          </div>
          <SkeletonBar className="h-20 w-full" />
          <SkeletonBar className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // default: card
  return (
    <div className="bg-bg-soft border border-border rounded-xl p-6 space-y-3">
      <SkeletonBar className="h-4 w-2/3" />
      <SkeletonBar className="h-4 w-full" />
      <SkeletonBar className="h-4 w-1/2" />
    </div>
  );
}
