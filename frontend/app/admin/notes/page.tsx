"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { showToast } from "@/components/admin/ui";
import { handleSaveFailure, type SaveResult } from "@/lib/config-save";

/* ══════════════════════════════════════════════════════════════
   笔记 —— 可见性管理 + 只读预览（2026-10-28 二次改造）

   分工原则：
     · 正文（title/content/folder）来自 Obsidian vault，每 30 分钟同步覆盖，
       在这里改了会被冲掉，所以继续保持只读。
     · 展示设置（visible / displayTitle / collection / sortOrder）存在数据库，
       同步脚本从不发送这几个字段，后端 updateNote 又是「传了才覆盖」，
       所以在这里改了不会被冲掉 —— 这正是本页存在的意义。

   安全前提：所有请求都带 X-Api-Key。/api/notes 的 GET 是公开接口，
   不带 key 只能拿到 visible=TRUE 的笔记，带 key 才返回全部（含草稿）。
   ══════════════════════════════════════════════════════════════ */

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

interface NoteData {
  id?: number;
  title: string;
  content: string;
  noteType?: string;
  folder: string;
  visible?: boolean | null;
  displayTitle?: string | null;
  collection?: string | null;
  sortOrder?: number | null;
  updatedAt?: string;
  createdAt?: string;
}

function countStats(md: string) {
  const text = md.replace(/[#*`~>\[\]()!_\-=|{}:;'",.<>/?\\\n\r]/g, " ").trim();
  const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = (text.match(/\b[a-zA-Z]+\b/g) || []).length;
  return { chars: md.length, lines: md.split("\n").length, words: words + chinese };
}

function fmtDate(iso?: string) {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : "";
}

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { "X-Api-Key": token } : {}),
  };
}

async function saveNote(id: number, patch: Record<string, unknown>): Promise<SaveResult> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    const res = await fetch(`${API}/notes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Api-Key": token } : {}),
      },
      body: JSON.stringify(patch),
    });
    if (res.ok) return { ok: true };
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== "undefined") localStorage.removeItem("admin_token");
      return { ok: false, reason: "unauthorized", message: "登录已过期，请重新登录后再操作" };
    }
    return { ok: false, reason: "server", message: `服务器返回 ${res.status}` };
  } catch {
    return { ok: false, reason: "network", message: "网络异常，请检查连接后重试" };
  }
}

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeFull, setActiveFull] = useState<NoteData | null>(null);
  const [search, setSearch] = useState("");
  const [filterFolder, setFilterFolder] = useState("");
  const [filterVis, setFilterVis] = useState<"" | "on" | "off">("");
  const [busy, setBusy] = useState(false);
  const [savingField, setSavingField] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      // light=true：列表只要 200 字预览，68 篇全文一次性拉太重
      const res = await fetch(`${API}/notes?light=true`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NoteData[] = await res.json();
      setNotes(data);
      if (data.length > 0 && data[0].id != null) setActiveId((prev) => prev ?? data[0].id!);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // 点开某篇时才拉全文（列表里只有预览）
  useEffect(() => {
    if (activeId == null) { setActiveFull(null); return; }
    let cancelled = false;
    fetch(`${API}/notes/${activeId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setActiveFull(d); })
      .catch(() => { if (!cancelled) setActiveFull(null); });
    return () => { cancelled = true; };
  }, [activeId]);

  const folders = useMemo(
    () => Array.from(new Set(notes.map((n) => n.folder).filter(Boolean))).sort(),
    [notes]
  );

  const visibleList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes.filter((n) => {
      if (filterFolder) {
        const f = n.folder || "";
        // 前缀匹配：选中「嵌入式」应包含「嵌入式/代码框架」这些子目录
        if (f !== filterFolder && !f.startsWith(filterFolder + "/")) return false;
      }
      if (filterVis === "on" && n.visible !== true) return false;
      if (filterVis === "off" && n.visible === true) return false;
      if (!q) return true;
      return (
        (n.title || "").toLowerCase().includes(q) ||
        (n.displayTitle || "").toLowerCase().includes(q) ||
        (n.content || "").toLowerCase().includes(q)
      );
    });
  }, [notes, search, filterFolder, filterVis]);

  const active = notes.find((n) => n.id === activeId) || null;
  const fullContent = activeFull?.content || active?.content || "";
  const stats = active ? countStats(fullContent) : null;
  const publishedCount = notes.filter((n) => n.visible === true).length;

  /* ── 单篇切换公开状态：立即生效 ── */
  async function toggleVisible(note: NoteData) {
    if (note.id == null) return;
    const next = note.visible !== true;
    setBusy(true);
    // 先乐观更新，网络慢也不卡手
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, visible: next } : n)));
    try {
      const res = await saveNote(note.id, { visible: next });
      if (res.ok) {
        showToast(
          next
            ? `已公开「${note.displayTitle || note.title}」`
            : `已转为草稿「${note.displayTitle || note.title}」`,
          "success"
        );
      } else {
        // 回滚乐观更新
        setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, visible: !next } : n)));
        handleSaveFailure(res, showToast);
      }
    } finally {
      setBusy(false);
    }
  }

  /* ── 批量：对当前筛选出的所有笔记生效 ── */
  async function batchSet(visible: boolean) {
    const ids = visibleList.map((n) => n.id).filter((x): x is number => x != null);
    if (ids.length === 0) { showToast("当前筛选下没有笔记", "error"); return; }
    if (ids.length > 10 && !confirm(`将对 ${ids.length} 篇笔记执行「${visible ? "公开" : "转草稿"}」，继续？`)) return;
    setBusy(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      const res = await fetch(`${API}/notes/batch-visibility`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "X-Api-Key": token } : {}),
        },
        body: JSON.stringify({ ids, visible }),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          if (typeof window !== "undefined") localStorage.removeItem("admin_token");
          showToast("登录已过期，请重新登录", "error");
          setTimeout(() => { window.location.href = "/admin"; }, 1600);
        } else {
          showToast(`批量操作失败：HTTP ${res.status}`, "error");
        }
        return;
      }
      const out = await res.json();
      setNotes((prev) =>
        prev.map((n) => (n.id != null && ids.includes(n.id) ? { ...n, visible } : n))
      );
      showToast(`${visible ? "已公开" : "已转草稿"} ${out.updated ?? ids.length} 篇`, "success");
    } catch {
      showToast("网络异常，请重试", "error");
    } finally {
      setBusy(false);
    }
  }

  /* ── 展示设置：输入框走防抖保存 ── */
  function patchSoon(id: number, patch: Record<string, unknown>) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    setSavingField(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await saveNote(id, patch);
        if (!res.ok) handleSaveFailure(res, showToast);
      } finally {
        setSavingField(false);
      }
    }, 900);
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* 说明条：讲清楚哪些能改、哪些改了会被覆盖 */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-accent/25 bg-accent/8 px-6 py-2 text-[12px] text-text-secondary">
        <span aria-hidden="true">🔓</span>
        <span>
          <strong className="text-text-primary">展示设置可改</strong>
          （公开状态 / 展示标题 / 栏目 / 排序），保存后立即生效且不会被同步覆盖。
        </span>
        <span className="text-text-muted">
          正文来自 <code className="rounded bg-black/20 px-1 font-mono">D:\知识库</code>，每 30 分钟同步覆盖，故保持只读。
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* ───── 左：列表 ───── */}
        <aside className="flex w-[21rem] shrink-0 flex-col border-r border-border">
          <div className="shrink-0 space-y-2 border-b border-border p-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标题或正文…"
              className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-[12.5px] text-text-primary outline-none placeholder:text-text-muted focus:border-accent/50"
            />
            <div className="flex gap-2">
              <select
                value={filterFolder}
                onChange={(e) => setFilterFolder(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-2 py-1.5 text-[11.5px] text-text-secondary outline-none focus:border-accent/50"
              >
                <option value="">全部目录</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}（
                    {notes.filter((n) => {
                      const nf = n.folder || "";
                      return nf === f || nf.startsWith(f + "/");
                    }).length}
                    ）
                  </option>
                ))}
              </select>
              <select
                value={filterVis}
                onChange={(e) => setFilterVis(e.target.value as "" | "on" | "off")}
                className="w-24 shrink-0 rounded-lg border border-border bg-bg px-2 py-1.5 text-[11.5px] text-text-secondary outline-none focus:border-accent/50"
              >
                <option value="">全部</option>
                <option value="on">已公开</option>
                <option value="off">草稿</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => batchSet(true)}
                disabled={busy}
                className="flex-1 rounded-lg border border-green-500/40 bg-green-500/10 px-2 py-1.5 text-[11.5px] text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-40"
                title="把当前筛选出的笔记全部公开"
              >
                全部公开
              </button>
              <button
                onClick={() => batchSet(false)}
                disabled={busy}
                className="flex-1 rounded-lg border border-border bg-bg-soft px-2 py-1.5 text-[11.5px] text-text-secondary transition-colors hover:bg-bg-soft/70 disabled:opacity-40"
                title="把当前筛选出的笔记全部转为草稿"
              >
                全部转草稿
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-[12px] text-text-muted">加载中…</p>
            ) : error ? (
              <p className="p-4 text-[12px] text-red-400">加载失败：{error}</p>
            ) : visibleList.length === 0 ? (
              <p className="p-4 text-[12px] text-text-muted">没有匹配的笔记</p>
            ) : (
              visibleList.map((n) => {
                const on = n.id === activeId;
                const pub = n.visible === true;
                return (
                  <div
                    key={n.id ?? n.title}
                    className={`flex items-start gap-2 border-b border-border/40 px-2.5 py-2 transition-colors ${
                      on ? "bg-accent/12" : "hover:bg-bg-soft/60"
                    }`}
                  >
                    {/* 可见性开关：点一下立即保存 */}
                    <button
                      onClick={() => toggleVisible(n)}
                      disabled={busy}
                      title={pub ? "已公开 —— 点击转为草稿" : "草稿 —— 点击公开到博客"}
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        pub
                          ? "border-green-500 bg-green-500/25 text-green-400"
                          : "border-border-strong text-text-muted hover:border-accent/60"
                      } disabled:opacity-50`}
                    >
                      {pub ? <span className="text-[9px] leading-none">●</span> : null}
                    </button>

                    <button
                      onClick={() => n.id != null && setActiveId(n.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span
                        className={`block truncate text-[12.5px] font-medium ${
                          on ? "text-accent" : pub ? "text-text-primary" : "text-text-secondary"
                        }`}
                      >
                        {n.displayTitle || n.title || "无标题"}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[10px] text-text-muted">
                        {n.collection ? `${n.collection} · ` : ""}
                        {n.folder || "根目录"} · {fmtDate(n.updatedAt)}
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="shrink-0 border-t border-border px-3 py-2 font-mono text-[10.5px] text-text-muted">
            当前 {visibleList.length} / 共 {notes.length} 篇 · 已公开 {publishedCount} 篇
          </div>
        </aside>

        {/* ───── 右：详情 + 展示设置 ───── */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          {!active ? (
            <p className="p-8 text-[13px] text-text-muted">从左侧选一篇笔记。</p>
          ) : (
            <article className="mx-auto max-w-[900px] px-8 py-7">
              <h1 className="font-wenkai text-[22px] leading-snug text-text-primary">
                {active.displayTitle || active.title || "无标题"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-text-muted">
                <span>{active.folder || "根目录"}</span>
                {active.updatedAt ? <span>更新 {fmtDate(active.updatedAt)}</span> : null}
                {stats ? (
                  <>
                    <span>{stats.words} 字</span>
                    <span>{stats.lines} 行</span>
                  </>
                ) : null}
                <span className={active.visible === true ? "text-green-400" : "text-amber-400"}>
                  {active.visible === true ? "● 已公开" : "○ 草稿"}
                </span>
                {savingField ? <span className="text-accent">保存中…</span> : null}
              </div>

              {/* 展示设置 */}
              <section className="mt-5 rounded-xl border border-border bg-bg-soft/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                    展示设置（存数据库，不被同步覆盖）
                  </span>
                  <button
                    onClick={() => toggleVisible(active)}
                    disabled={busy}
                    className={`rounded-lg border px-2.5 py-1 text-[11.5px] transition-colors ${
                      active.visible === true
                        ? "border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                    } disabled:opacity-40`}
                  >
                    {active.visible === true ? "已公开 → 转为草稿" : "草稿 → 公开到博客"}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-[11px] text-text-muted">展示标题</span>
                    <input
                      type="text"
                      value={active.displayTitle ?? ""}
                      onChange={(e) =>
                        active.id != null && patchSoon(active.id, { displayTitle: e.target.value })
                      }
                      placeholder={active.title || "留空则用原标题"}
                      className="w-full rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text-primary outline-none placeholder:text-text-muted focus:border-accent/50"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] text-text-muted">栏目</span>
                    <input
                      type="text"
                      list="kb-collections"
                      value={active.collection ?? ""}
                      onChange={(e) =>
                        active.id != null && patchSoon(active.id, { collection: e.target.value })
                      }
                      placeholder={active.folder || "未分组"}
                      className="w-full rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text-primary outline-none placeholder:text-text-muted focus:border-accent/50"
                    />
                    <datalist id="kb-collections">
                      {Array.from(new Set(notes.map((n) => n.collection).filter(Boolean))).map((c) => (
                        <option key={c!} value={c!} />
                      ))}
                    </datalist>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] text-text-muted">排序（小的在前）</span>
                    <input
                      type="number"
                      value={active.sortOrder ?? 0}
                      onChange={(e) =>
                        active.id != null &&
                        patchSoon(active.id, { sortOrder: Number(e.target.value) || 0 })
                      }
                      className="w-full rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text-primary outline-none focus:border-accent/50"
                    />
                  </label>
                </div>
              </section>

              <div className="mt-5 rounded-xl border border-border bg-bg-soft/40">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                    Markdown 原文（只读 · 由 Obsidian 同步）
                  </span>
                </div>
                <pre className="max-h-[calc(100vh-30rem)] overflow-auto whitespace-pre-wrap break-words px-4 py-4 font-mono text-[12px] leading-[1.75] text-text-secondary">
{fullContent || "（空笔记）"}
                </pre>
              </div>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
