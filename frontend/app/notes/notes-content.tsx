"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface NoteData {
  id: number;
  title: string;
  content: string;
  noteType?: string;
  htmlContent?: string;
  slug?: string;
  folder: string;
  updatedAt: string;
}

export default function NotesContent({ notes }: { notes: NoteData[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Extract folders
  const folders = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => { if (n.folder) set.add(n.folder); });
    return Array.from(set).sort();
  }, [notes]);

  // Filter notes
  const filtered = useMemo(() => {
    let result = notes;
    if (activeFolder) result = result.filter((n) => n.folder === activeFolder);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) => n.title.toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [notes, activeFolder, search]);

  // Group by folder
  const grouped = useMemo(() => {
    const map: Record<string, NoteData[]> = {};
    for (const n of filtered) {
      const key = n.folder || "未分类";
      if (!map[key]) map[key] = [];
      map[key].push(n);
    }
    return Object.entries(map).sort(([a], [b]) => {
      if (a === "未分类") return 1;
      if (b === "未分类") return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  function getPreview(content: string | null): string {
    if (!content) return "";
    return content.replace(/[#*`~>\[\]()!\-\n\r]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  }

  if (notes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-24">
        <header className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">笔记</h1>
        </header>
        <div className="text-center py-16">
          <p className="text-text-muted text-sm mb-4">暂无笔记</p>
          <p className="text-text-muted text-xs">
            在管理后台的「笔记」页面创建笔记，或从有道云笔记导出后导入。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-12 pb-24">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-1">笔记</h1>
        <p className="text-text-muted text-sm">
          共 {notes.length} 篇 · {folders.length} 个文件夹
        </p>
      </header>

      {/* Search + folder filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索笔记..."
            className="w-full bg-bg-soft border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-colors"
          />
        </div>
        {folders.length > 0 && (
          <select
            value={activeFolder || ""}
            onChange={(e) => setActiveFolder(e.target.value || null)}
            className="bg-bg-soft border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:border-accent outline-none transition-colors"
          >
            <option value="">全部文件夹</option>
            {folders.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        )}
      </div>

      {/* Grouped notes */}
      <div className="space-y-8">
        {grouped.map(([folder, items]) => (
          <section key={folder}>
            {grouped.length > 1 && (
              <h2 className="text-xs font-semibold text-accent uppercase tracking-wider mb-4 flex items-center gap-3">
                {folder}
                <span className="h-px flex-1 bg-border" />
                <span className="text-text-muted font-normal normal-case tracking-normal">{items.length} 篇</span>
              </h2>
            )}
            <div className="space-y-2">
              {items.map((note) => (
                <div
                  key={note.id}
                  className="bg-bg-soft border border-border rounded-xl overflow-hidden hover:border-accent/30 transition-colors"
                >
                  <button
                    onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-text-primary truncate">
                        {note.title || "无标题"}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
                        {note.updatedAt && (
                          <span>
                            {new Date(note.updatedAt).toLocaleDateString("zh-CN", {
                              year: "numeric", month: "short", day: "numeric",
                            })}
                          </span>
                        )}
                        <span className="truncate">{getPreview(note.content)}</span>
                      </div>
                    </div>
                    <svg
                      className={`w-4 h-4 text-text-muted shrink-0 mt-1 transition-transform ${expandedId === note.id ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {expandedId === note.id && (
                    <div className="px-4 pb-4 border-t border-border/50">
                      <div
                        className="prose max-w-none mt-3 text-sm leading-relaxed whitespace-pre-wrap text-text-secondary"
                        dangerouslySetInnerHTML={{ __html: note.content || "" }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
