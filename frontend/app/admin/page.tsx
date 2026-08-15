"use client";

import { useAuth } from "@/lib/admin/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminButton, AdminAlert } from "@/components/admin/ui";

export default function AdminLoginPage() {
  const { isAuthenticated, login } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace("/admin/dashboard");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(password);
    if (!ok) {
      setError("密码错误");
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent text-xl font-bold mx-auto mb-4 ring-1 ring-accent/20">
            D
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-1">devlog 管理</h1>
          <p className="text-text-muted text-xs">请输入密码以继续</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-bg-soft border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-text-secondary mb-1.5">
              管理员密码
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoFocus
                required
                className="w-full bg-bg border border-border rounded-lg pl-3 pr-10 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-text-muted hover:text-text-secondary transition-colors"
                aria-label={showPwd ? "隐藏密码" : "显示密码"}
                tabIndex={-1}
              >
                {showPwd ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <AdminAlert>{error}</AdminAlert>}

          <AdminButton type="submit" disabled={loading || !password} className="w-full justify-center">
            {loading ? "验证中..." : "登 录"}
          </AdminButton>
        </form>

        <div className="text-center mt-6">
          <a href="/" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
            返回博客首页
          </a>
        </div>
      </div>
    </div>
  );
}
