"use client";

import { useState, useEffect, useMemo } from "react";

/* ══════════════════════════════════════════════════════════════
   笔记 —— 只读浏览（2026-10-28 改造）

   为什么改只读：
   笔记的真正来源是 Obsidian vault（D:\知识库），服务器上有个 cron
   每 30 分钟从 git 拉取并覆盖数据库。在后台改的笔记会在下一次同步时
   被冲掉，改了半天白改。所以这里只保留「看」的能力，
   增删改统一回本地 Obsidian 做，改完等同步即可。

   想看代码怎么改的：原来这里是个 470 行的完整编辑器，
   有新建/编辑/删除/导入四个写操作，现在全部移除。
   ══════════════════════════════════════════════════════════════ */

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

interface NoteData {
  id?: number;
  title: string;
  content: string;
  noteType?: string;
  folder: string;
  updatedAt?: string;
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

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterFolder, setFilterFolder] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    fetch(`${API}/notes`, { headers: token ? { "X-Api-Key": token } : {} })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: NoteData[]) => {
        setNotes(data);
        if (data.length > 0 && data[0].id != null) setActiveId(data[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const folders = useMemo(
    () => Array.from(new Set(notes.map((n) => n.folder).filter(Boolean))).sort(),
    [notes]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes.filter((n) => {
      if (filterFolder && n.folder !== filterFolder) return false;
      if (!q) return true;
      return (
        (n.title || "").toLowerCase().includes(q) ||
        (n.content || "").toLowerCase().includes(q)
      );
    });
  }, [notes, search, filterFolder]);

  const active = notes.find((n) => n.id === activeId) || null;
  const stats = active ? countStats(active.content || "") : null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* 只读提示条 */}
      <div className="flex shrink-0 items-center gap-2 border-b border-amber-500/25 bg-amber-500/10 px-6 py-2 text-[12px] text-amber-300">
        <span aria-hidden="true">🔒</span>
        <span>
          只读模式 —— 笔记由 Obsidian vault 每 30 分钟自动同步，后台改动会被覆盖。
          增删改请到本地 <code className="rounded bg-black/20 px-1 font-mono">D:\知识库</code> 编辑。
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* 左：列表 */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-border">
          <div className="shrink-0 space-y-2 border-b border-border p-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标题或正文…"
              className="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-[12.5px] text-text-primary outline-none placeholder:text-text-muted focus:border-accent/50"
            />
            <select
              value={filterFolder}
              onChange={(e) => setFilterFolder(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-[12px] text-text-secondary outline-none focus:border-accent/50"
            >
              <option value="">全部目录（{notes.length}）</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}（{notes.filter((n) => n.folder === f).length}）
                </option>
              ))}
            </select>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-[12px] text-text-muted">加载中…</p>
            ) : error ? (
              <p className="p-4 text-[12px] text-red-400">加载失败：{error}</p>
            ) : visible.length === 0 ? (
              <p className="p-4 text-[12px] text-text-muted">没有匹配的笔记</p>
            ) : (
              visible.map((n) => {
                const on = n.id === activeId;
                return (
                  <button
                    key={n.id ?? n.title}
                    onClick={() => n.id != null && setActiveId(n.id)}
                    className={`block w-full border-b border-border/40 px-3 py-2.5 text-left transition-colors ${
                      on ? "bg-accent/12" : "hover:bg-bg-soft/60"
                    }`}
                  >
                    <span
                      className={`block truncate text-[12.5px] font-medium ${
                        on ? "text-accent" : "text-text-primary"
                      }`}
                    >
                      {n.title || "无标题"}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[10px] text-text-muted">
                      {fmtDate(n.updatedAt)} · {n.folder || "根目录"}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="shrink-0 border-t border-border px-3 py-2 font-mono text-[10.5px] text-text-muted">
            {visible.length} / {notes.length} 篇
          </div>
        </aside>

        {/* 右：内容（只读） */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          {!active ? (
            <p className="p-8 text-[13px] text-text-muted">从左侧选一篇笔记查看。</p>
          ) : (
            <article className="mx-auto max-w-[900px] px-8 py-7">
              <h1 className="font-wenkai text-[22px] leading-snug text-text-primary">
                {active.title || "无标题"}
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
              </div>

              <div className="mt-5 rounded-xl border border-border bg-bg-soft/40">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                    Markdown 原文（只读）
                  </span>
                </div>
                <pre className="max-h-[calc(100vh-16rem)] overflow-auto whitespace-pre-wrap break-words px-4 py-4 font-mono text-[12px] leading-[1.75] text-text-secondary">
{active.content || "（空笔记）"}
                </pre>
              </div>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
