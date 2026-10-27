"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

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

interface FolderNode {
  path: string;
  label: string;
  depth: number;
  count: number;
}

export default function NotesContent({ notes }: { notes: NoteData[] }) {
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  // 目录树:把 folder 路径("嵌入式/代码框架")拆成层级节点,并累计子目录笔记数
  const folderNodes = useMemo<FolderNode[]>(() => {
    const exact = new Map<string, number>();
    for (const n of notes) {
      const f = n.folder || "";
      exact.set(f, (exact.get(f) || 0) + 1);
    }
    const paths = new Set<string>(exact.keys());
    for (const f of Array.from(exact.keys())) {
      if (!f) continue;
      const parts = f.split("/");
      for (let i = 1; i <= parts.length; i++) {
        paths.add(parts.slice(0, i).join("/"));
      }
    }
    return Array.from(paths)
      .sort((a, b) => {
        if (a === "") return -1;
        if (b === "") return 1;
        return a.localeCompare(b, "zh-CN");
      })
      .map((p) => {
        let count = 0;
        for (const [f, c] of Array.from(exact.entries())) {
          if (p === "") {
            if (f === "") count += c;
          } else if (f === p || f.startsWith(p + "/")) {
            count += c;
          }
        }
        return {
          path: p,
          label: p === "" ? "根目录" : p.split("/").pop() || p,
          depth: p === "" ? 0 : p.split("/").length - 1,
          count,
        };
      })
      .filter((n) => n.count > 0);
  }, [notes]);

  const visible = useMemo(() => {
    let result = notes;
    if (activeFolder !== null) {
      if (activeFolder === "") {
        result = result.filter((n) => !(n.folder || ""));
      } else {
        result = result.filter((n) => {
          const f = n.folder || "";
          return f === activeFolder || f.startsWith(activeFolder + "/");
        });
      }
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (n) =>
          (n.title || "").toLowerCase().includes(q) ||
          (n.content || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [notes, activeFolder, search]);

  // 按 folder 分组展示
  const grouped = useMemo(() => {
    const map = new Map<string, NoteData[]>();
    for (const n of visible) {
      const key = n.folder || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }
    return Array.from(map.entries()).sort(([a], [b]) =>
      a === "" ? -1 : b === "" ? 1 : a.localeCompare(b, "zh-CN")
    );
  }, [visible]);

  function preview(content: string | null): string {
    if (!content) return "";
    return content
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/[#*`~>|[\]()!_\-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 90);
  }

  const totalFolders = folderNodes.filter((n) => n.path !== "").length;

  return (
    <div className="max-w-5xl mx-auto px-4 pt-12 pb-24">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-1">
          知识库
        </h1>
        <p className="text-text-muted text-sm">
          {notes.length} 篇 · {totalFolders} 个目录 · 来自本地 Obsidian vault
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-6">
        {/* 左侧目录树 */}
        <aside className="md:w-52 shrink-0">
          <div className="md:sticky md:top-20">
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-2">
              目录
            </div>
            <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto no-scrollbar md:overflow-visible pb-2 md:pb-0">
              <button
                onClick={() => setActiveFolder(null)}
                className={`text-left whitespace-nowrap px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
                  activeFolder === null
                    ? "bg-accent/15 text-accent font-medium"
                    : "text-text-secondary hover:bg-bg-soft hover:text-text-primary"
                }`}
              >
                全部 <span className="text-text-muted text-[11px]">{notes.length}</span>
              </button>
              {folderNodes.map((node) => (
                <button
                  key={node.path || "__root"}
                  onClick={() =>
                    setActiveFolder(activeFolder === node.path ? null : node.path)
                  }
                  style={{ paddingLeft: `${10 + node.depth * 12}px` }}
                  className={`text-left whitespace-nowrap pr-2.5 py-1.5 rounded-lg text-[13px] transition-colors flex items-center gap-1.5 ${
                    activeFolder === node.path
                      ? "bg-accent/15 text-accent font-medium"
                      : "text-text-secondary hover:bg-bg-soft hover:text-text-primary"
                  }`}
                >
                  <span className="truncate">{node.label}</span>
                  <span className="text-text-muted text-[11px] shrink-0">{node.count}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* 右侧内容 */}
        <div className="flex-1 min-w-0">
          <div className="relative mb-5">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标题或正文..."
              className="w-full bg-bg-soft border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-colors"
            />
          </div>

          {visible.length === 0 && (
            <p className="text-text-muted text-sm py-12 text-center">
              没有匹配的内容
            </p>
          )}

          <div className="space-y-7">
            {grouped.map(([folder, items]) => (
              <section key={folder || "__root"}>
                {grouped.length > 1 && (
                  <h2 className="text-[11px] font-semibold text-accent uppercase tracking-wider mb-2.5 flex items-center gap-2">
                    {folder || "根目录"}
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-text-muted font-normal normal-case tracking-normal">
                      {items.length}
                    </span>
                  </h2>
                )}
                <div className="flex flex-col gap-1.5">
                  {items.map((note) => (
                    <Link
                      key={note.id}
                      href={`/notes/${note.id}`}
                      className="group block bg-bg-soft border border-border rounded-xl px-4 py-3 hover:border-accent/40 transition-colors"
                    >
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate flex-1">
                          {note.noteType === "mindmap" && "🧠 "}
                          {note.title || "无标题"}
                        </h3>
                        <span className="text-[10px] text-text-muted shrink-0">
                          {note.updatedAt &&
                            new Date(note.updatedAt).toLocaleDateString("zh-CN", {
                              year: "numeric", month: "numeric", day: "numeric",
                            })}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-1 truncate">
                        {preview(note.content)}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
