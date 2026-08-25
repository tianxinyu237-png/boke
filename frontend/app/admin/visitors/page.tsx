"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AdminButton, showToast, AdminConfirmDialog } from "@/components/admin/ui";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

interface RankRow {
  ip: string; count: number; firstAt: string; lastAt: string; notFound: number;
}
interface RecentLog {
  id: number; ip: string; ua: string; path: string; method: string;
  status: number; referer: string; createdAt: string;
}
interface BlockedRow {
  ip: string; reason: string; blockedAt: string; expiresAt: string;
}
interface Overview { total: number; today: number; activeIps: number; suspiciousIps: number }

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["X-Api-Key"] = token;
  return h;
}

async function getJSON(path: string): Promise<any> {
  const res = await fetch(`${API}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("请求失败");
  return res.json();
}

function fmt(t: string | null | undefined): string {
  if (!t) return "-";
  return new Date(t).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function shortUa(ua: string): string {
  if (!ua) return "-";
  if (ua.length <= 48) return ua;
  return ua.slice(0, 48) + "…";
}

function flagOf(r: RankRow, blockedIps: Set<string>): { label: string; cls: string } | null {
  if (blockedIps.has(r.ip)) return { label: "已封禁", cls: "bg-red-500/15 text-red-400" };
  if (r.count >= 100) return { label: "高频", cls: "bg-amber-500/15 text-amber-400" };
  if (r.notFound >= 20 && r.notFound / r.count >= 0.3) return { label: "404轰炸", cls: "bg-orange-500/15 text-orange-400" };
  return null;
}

export default function AdminVisitorsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [rank, setRank] = useState<RankRow[]>([]);
  const [recent, setRecent] = useState<RecentLog[]>([]);
  const [blocked, setBlocked] = useState<BlockedRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "suspicious" | "highfreq" | "notfound">("all");
  const [detailIp, setDetailIp] = useState<string | null>(null);
  const [detailLogs, setDetailLogs] = useState<RecentLog[]>([]);
  const [blockTarget, setBlockTarget] = useState<RankRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [ov, rk, rc, bl] = await Promise.all([
        getJSON("/visitors/overview"),
        getJSON("/visitors/rank"),
        getJSON("/visitors/recent"),
        getJSON("/visitors/blocked"),
      ]);
      setOverview(ov);
      setRank(rk);
      setRecent(rc);
      setBlocked(bl);
    } catch {
      showToast("加载失败,请确认已登录", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const blockedIps = useMemo(() => new Set(blocked.map((b) => b.ip)), [blocked]);

  const filteredRank = useMemo(() => {
    let list = rank;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => r.ip.toLowerCase().includes(q));
    }
    if (filter === "highfreq") list = list.filter((r) => r.count >= 100);
    else if (filter === "notfound") list = list.filter((r) => r.notFound >= 20 && r.notFound / r.count >= 0.3);
    else if (filter === "suspicious") list = list.filter((r) => flagOf(r, blockedIps));
    return list;
  }, [rank, search, filter, blockedIps]);

  async function openDetail(ip: string) {
    if (detailIp === ip) { setDetailIp(null); return; }
    setDetailIp(ip);
    try {
      setDetailLogs(await getJSON(`/visitors/recent?ip=${encodeURIComponent(ip)}`));
    } catch {
      setDetailLogs([]);
    }
  }

  async function doBlock() {
    if (!blockTarget) return;
    const res = await fetch(`${API}/visitors/block`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ip: blockTarget.ip, reason: "手动封禁", hours: 24 }),
    });
    if (res.ok) {
      showToast(`已封禁 ${blockTarget.ip}(24h)`, "success");
      setBlockTarget(null);
      refresh();
    } else {
      showToast("封禁失败", "error");
    }
  }

  async function doUnblock(ip: string) {
    const res = await fetch(`${API}/visitors/unblock`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ip }),
    });
    if (res.ok) {
      showToast(`已解封 ${ip}`, "success");
      refresh();
    } else {
      showToast("解封失败", "error");
    }
  }

  const card = "bg-bg-soft border border-border rounded-xl p-4";
  const th = "text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider px-3 py-2";
  const td = "px-3 py-2.5 text-xs text-text-secondary align-middle";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">访客统计</h2>
          <p className="text-text-muted text-xs mt-1">IP / 访问记录 / 频次分析 / 黑名单封禁(数据保留 30 天)</p>
        </div>
        <AdminButton variant="secondary" onClick={refresh} disabled={loading}>刷新</AdminButton>
      </div>

      {/* 概览 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "今日访问", value: overview?.today ?? "-", icon: "📈" },
          { label: "30天总记录", value: overview?.total ?? "-", icon: "🗂️" },
          { label: "活跃 IP", value: overview?.activeIps ?? "-", icon: "👥" },
          { label: "可疑 IP", value: overview?.suspiciousIps ?? "-", icon: "⚠️" },
        ].map((s) => (
          <div key={s.label} className={card}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-text-muted">{s.label}</span>
              <span>{s.icon}</span>
            </div>
            <div className="text-xl font-bold text-text-primary">{s.value}</div>
          </div>
        ))}
      </div>

      {/* IP 排行 */}
      <div className={card}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary">IP 访问排行</h3>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索 IP…"
              className="h-8 px-3 rounded-lg text-xs bg-bg-mute border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 w-40"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="h-8 px-2 rounded-lg text-xs bg-bg-mute border border-border text-text-primary focus:outline-none"
            >
              <option value="all">全部</option>
              <option value="suspicious">可疑</option>
              <option value="highfreq">高频(≥100次)</option>
              <option value="notfound">404轰炸</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>IP</th>
                <th className={th}>次数</th>
                <th className={th}>404</th>
                <th className={th}>首次</th>
                <th className={th}>最后访问</th>
                <th className={th}>标记</th>
                <th className={th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRank.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-xs text-text-muted">暂无数据</td></tr>
              )}
              {filteredRank.slice(0, 100).map((r) => {
                const flag = flagOf(r, blockedIps);
                const open = detailIp === r.ip;
                return (
                  <FragmentRow key={r.ip} r={r} open={open} flag={flag}
                    onToggle={() => openDetail(r.ip)}
                    onBlock={() => setBlockTarget(r)}
                    onUnblock={() => doUnblock(r.ip)}
                    detailLogs={detailLogs} th={th} td={td}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 最近访问 */}
      <div className={card}>
        <h3 className="text-sm font-semibold text-text-primary mb-3">最近访问(100 条)</h3>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-bg-soft">
              <tr className="border-b border-border">
                <th className={th}>时间</th>
                <th className={th}>IP</th>
                <th className={th}>方法</th>
                <th className={th}>路径</th>
                <th className={th}>UA</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((l) => (
                <tr key={l.id} className="border-b border-border/40 hover:bg-bg-mute/40">
                  <td className={td}>{fmt(l.createdAt)}</td>
                  <td className={td}>
                    <button className="text-accent hover:underline" onClick={() => openDetail(l.ip)}>{l.ip}</button>
                  </td>
                  <td className={td}>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${l.method === "GET" ? "bg-accent/10 text-accent" : "bg-amber-500/15 text-amber-400"}`}>{l.method}</span>
                  </td>
                  <td className={`${td} font-mono max-w-[240px] truncate`}>{l.path}</td>
                  <td className={`${td} text-text-muted max-w-[200px] truncate`}>{shortUa(l.ua)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 黑名单 */}
      <div className={card}>
        <h3 className="text-sm font-semibold text-text-primary mb-3">黑名单(封禁中)</h3>
        {blocked.length === 0 ? (
          <p className="text-xs text-text-muted py-2">当前没有封禁的 IP</p>
        ) : (
          <div className="space-y-2">
            {blocked.map((b) => (
              <div key={b.ip} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-mute/50 border border-border">
                <span className="text-xs font-mono text-text-primary">{b.ip}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">封禁中</span>
                <span className="text-xs text-text-muted flex-1 truncate">{b.reason || "手动封禁"}</span>
                <span className="text-[10px] text-text-muted">至 {fmt(b.expiresAt)}</span>
                <button onClick={() => doUnblock(b.ip)} className="text-[11px] text-accent hover:underline shrink-0">解封</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminConfirmDialog
        open={blockTarget !== null}
        title="封禁 IP"
        message={blockTarget ? `确定封禁 ${blockTarget.ip} 吗?该 IP 访问博客将返回 403,24 小时后自动解封。` : ""}
        confirmLabel="封禁 24h"
        onConfirm={doBlock}
        onCancel={() => setBlockTarget(null)}
      />
    </div>
  );
}

function FragmentRow({ r, open, flag, onToggle, onBlock, onUnblock, detailLogs, th, td }: {
  r: RankRow; open: boolean;
  flag: { label: string; cls: string } | null;
  onToggle: () => void; onBlock: () => void; onUnblock: () => void;
  detailLogs: RecentLog[]; th: string; td: string;
}) {
  return (
    <>
      <tr className="border-b border-border/40 hover:bg-bg-mute/40 cursor-pointer" onClick={onToggle}>
        <td className={`${td} font-mono text-text-primary`}>
          {r.ip}
          {open && <span className="ml-2 text-[10px] text-accent">▾</span>}
        </td>
        <td className={`${td} font-semibold ${r.count >= 100 ? "text-amber-400" : ""}`}>{r.count}</td>
        <td className={td}>{r.notFound > 0 ? <span className={r.notFound / r.count >= 0.3 ? "text-orange-400" : ""}>{r.notFound}</span> : "-"}</td>
        <td className={td}>{fmt(r.firstAt)}</td>
        <td className={td}>{fmt(r.lastAt)}</td>
        <td className={td}>
          {flag ? <span className={`px-2 py-0.5 rounded-full text-[10px] ${flag.cls}`}>{flag.label}</span> : <span className="text-text-muted">-</span>}
        </td>
        <td className={td} onClick={(e) => e.stopPropagation()}>
          {flag?.label === "已封禁" ? (
            <button onClick={onUnblock} className="text-[11px] text-accent hover:underline">解封</button>
          ) : (
            <button onClick={onBlock} className="text-[11px] text-red-400 hover:underline">封禁</button>
          )}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} className="px-4 pb-3">
            <div className="bg-bg-mute/50 rounded-lg p-3">
              <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">该 IP 最近访问</div>
              {detailLogs.length === 0 ? (
                <p className="text-xs text-text-muted">无记录</p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {detailLogs.map((l) => (
                    <div key={l.id} className="flex items-center gap-3 text-[11px] text-text-secondary">
                      <span className="text-text-muted shrink-0">{fmt(l.createdAt)}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${l.method === "GET" ? "bg-accent/10 text-accent" : "bg-amber-500/15 text-amber-400"}`}>{l.method}</span>
                      <span className="font-mono truncate">{l.path}</span>
                      <span className={`shrink-0 ${l.status === 404 ? "text-orange-400" : "text-text-muted"}`}>{l.status || "-"}</span>
                      <span className="text-text-muted truncate max-w-[200px]">{shortUa(l.ua)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
