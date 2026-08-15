import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-32 text-center">
      <p className="text-text-muted text-6xl font-bold mb-4">404</p>
      <h1 className="text-text-primary text-xl font-semibold mb-2">
        页面不存在
      </h1>
      <p className="text-text-secondary mb-8">
        你访问的页面不存在或已被移除。
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-soft text-text-secondary hover:text-accent border border-border transition-colors text-sm"
      >
        返回首页
      </Link>
    </div>
  );
}
