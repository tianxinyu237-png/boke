"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CaretRight,
  Clock,
  ListBullets,
  X,
} from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { prepareNoteMarkdown } from "@/lib/obsidian";
import {
  buildFolderTree,
  extractToc,
  type KbFolderNode,
  type TocItem,
} from "@/lib/toc";

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

/* ───────────────────────── 左侧目录树节点 ───────────────────────── */
function FolderBranch({
  node,
  openSet,
  toggle,
  currentFolder,
}: {
  node: KbFolderNode;
  openSet: Set<string>;
  toggle: (p: string) => void;
  currentFolder: string;
}) {
  const isOpen = openSet.has(node.path);
  const isCurrent =
    currentFolder === node.path || currentFolder.startsWith(node.path + "/");
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => (hasChildren ? toggle(node.path) : undefined)}
        style={{ paddingLeft: `${8 + node.depth * 11}px` }}
        className={`group flex w-full items-center gap-1 rounded-lg py-1.5 pr-2 text-left text-[13px] transition-colors ${
          isCurrent
            ? "text-accent"
            : "text-text-secondary hover:bg-bg-soft hover:text-text-primary"
        }`}
        title={node.path}
      >
        {hasChildren ? (
          <CaretRight
            className={`h-3 w-3 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
            weight="bold"
          />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span className="truncate flex-1">{node.label}</span>
        <span className="shrink-0 text-[10px] text-text-muted">{node.count}</span>
      </button>
      {hasChildren && isOpen && (
        <div className="border-l border-border/60 ml-4">
          {node.children.map((c) => (
            <FolderBranch
              key={c.path}
              node={c}
              openSet={openSet}
              toggle={toggle}
              currentFolder={currentFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NoteDetailClient({ note }: { note: NoteData }) {
  const router = useRouter();
  const [all, setAll] = useState<NoteData[]>([]);
  const [activeId, setActiveId] = useState("");
  const [progress, setProgress] = useState(0);
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());
  const [tocOpen, setTocOpen] = useState(false);

  /* 全量笔记：双链映射 + 目录树 + 上下篇 */
  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || "/api";
    fetch(`${api}/notes?light=true`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: NoteData[]) => setAll(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const titleToHref = useMemo(() => {
    const map: Record<string, string> = {};
    for (const n of all) map[n.title] = `/notes/${n.id}`;
    return map;
  }, [all]);

  const md = useMemo(
    () => prepareNoteMarkdown(note.content || "", titleToHref),
    [note.content, titleToHref]
  );

  /* 目录（TOC） */
  const toc = useMemo<TocItem[]>(() => extractToc(md, 3), [md]);

  /* 左侧目录树 */
  const tree = useMemo(() => buildFolderTree(all), [all]);

  useEffect(() => {
    const parts = (note.folder || "").split("/").filter(Boolean);
    const acc = new Set<string>();
    for (let i = 1; i <= parts.length; i++) {
      acc.add(parts.slice(0, i).join("/"));
    }
    setOpenSet(acc);
  }, [note.folder]);

  const toggle = useCallback((p: string) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }, []);

  /* 给正文标题打 id（与 TOC 顺序一一对应） */
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".kb-note-body h1, .kb-note-body h2, .kb-note-body h3"
      )
    );
    toc.forEach((t, i) => {
      const el = els[i];
      if (el && el.id !== t.id) el.id = t.id;
    });
  }, [md, toc]);

  /* scrollspy + 阅读进度 */
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0);

      const heads = toc
        .map((t) => document.getElementById(t.id))
        .filter((el): el is HTMLElement => !!el);
      if (!heads.length) return;

      const mark = window.scrollY + window.innerHeight * 0.22;
      let cur = heads[0].id;
      for (const h of heads) {
        if (h.offsetTop <= mark) cur = h.id;
        else break;
      }
      setActiveId(cur);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [toc, md]);

  /* 同目录排序 → 上一篇 / 下一篇 */
  const ordered = useMemo(() => {
    const same = all.filter((n) => (n.folder || "") === (note.folder || ""));
    return same.sort((a, b) => (a.title || "").localeCompare(b.title || "", "zh-CN"));
  }, [all, note]);

  const idx = ordered.findIndex((n) => n.id === note.id);
  const prev = idx > 0 ? ordered[idx - 1] : null;
  const next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null;

  const siblings = useMemo(
    () => ordered.filter((n) => n.id !== note.id),
    [ordered, note.id]
  );

  const readMinutes = Math.max(1, Math.round((note.content || "").length / 420));

  function jump(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 92;
    window.scrollTo({ top, behavior: "smooth" });
    setTocOpen(false);
  }

  const tocList = (
    <nav className="flex flex-col gap-0.5">
      {toc.map((t) => {
        const active = activeId === t.id;
        return (
          <button
            key={t.id}
            onClick={() => jump(t.id)}
            style={{ paddingLeft: `${8 + (t.level - 1) * 12}px` }}
            className={`relative rounded-md py-1.5 pr-2 text-left text-[12.5px] leading-snug transition-colors ${
              active
                ? "bg-accent/10 font-medium text-accent"
                : "text-text-muted hover:bg-bg-soft hover:text-text-primary"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-accent" />
            )}
            <span className="line-clamp-2">{t.text}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 顶部阅读进度细线 */}
      <div
        className="fixed left-0 top-0 z-50 h-[2px] bg-accent transition-[width] duration-150"
        style={{ width: `${progress}%` }}
        aria-hidden
      />

      <div className="mx-auto flex w-full max-w-[1440px] gap-8 px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        {/* ───────── 左：知识库目录树 ───────── */}
        <aside className="hidden w-[248px] shrink-0 xl:block">
          <div className="sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 thin-scroll">
            <div className="mb-2 flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <ListBullets className="h-3.5 w-3.5" />
              知识库目录
            </div>
            <Link
              href="/notes"
              className="mb-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] text-text-secondary transition-colors hover:bg-bg-soft hover:text-text-primary"
            >
              <ArrowLeft className="h-3 w-3" />
              全部 {all.length} 篇
            </Link>
            {tree.map((n) => (
              <FolderBranch
                key={n.path}
                node={n}
                openSet={openSet}
                toggle={toggle}
                currentFolder={note.folder || ""}
              />
            ))}
          </div>
        </aside>

        {/* ───────── 中：正文 ───────── */}
        <div className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[760px]">
            <button
              onClick={() => router.back()}
              className="mb-5 flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              返回知识库
            </button>

            <div className="mb-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {note.noteType === "mindmap" && <span className="text-lg">🧠</span>}
                {note.folder && (
                  <Link
                    href="/notes"
                    className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent transition-colors hover:bg-accent/20"
                  >
                    {note.folder}
                  </Link>
                )}
                <span className="text-xs text-text-muted">
                  {new Date(note.updatedAt).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Clock className="h-3 w-3" />约 {readMinutes} 分钟
                </span>
                {toc.length > 0 && (
                  <button
                    onClick={() => setTocOpen(true)}
                    className="ml-auto flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-accent/40 hover:text-accent lg:hidden"
                  >
                    <ListBullets className="h-3.5 w-3.5" />
                    目录
                  </button>
                )}
              </div>
              <h1 className="serif-title text-[26px] font-semibold leading-tight text-text-primary sm:text-[32px]">
                {note.title}
              </h1>
            </div>

            {note.noteType === "mindmap" && note.htmlContent ? (
              <div
                className="overflow-hidden rounded-2xl border border-border"
                style={{ minHeight: "80vh" }}
              >
                <iframe
                  srcDoc={note.htmlContent}
                  className="w-full border-0"
                  style={{ height: "80vh" }}
                  title={note.title}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            ) : (
              <article className="prose prose-invert kb-note-body max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {md}
                </ReactMarkdown>
              </article>
            )}

            {/* 上一篇 / 下一篇 */}
            {(prev || next) && (
              <nav className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
                {prev ? (
                  <Link
                    href={`/notes/${prev.id}`}
                    className="group min-w-0 rounded-xl border border-border bg-bg-soft px-4 py-3 transition-colors hover:border-accent/40"
                  >
                    <div className="mb-1 flex items-center gap-1 text-[11px] text-text-muted">
                      <ArrowLeft className="h-3 w-3" /> 上一篇
                    </div>
                    <div className="truncate text-[13px] text-text-primary group-hover:text-accent">
                      {prev.title}
                    </div>
                  </Link>
                ) : (
                  <span className="hidden sm:block" />
                )}
                {next && (
                  <Link
                    href={`/notes/${next.id}`}
                    className="group min-w-0 rounded-xl border border-border bg-bg-soft px-4 py-3 text-right transition-colors hover:border-accent/40"
                  >
                    <div className="mb-1 flex items-center justify-end gap-1 text-[11px] text-text-muted">
                      下一篇 <ArrowRight className="h-3 w-3" />
                    </div>
                    <div className="truncate text-[13px] text-text-primary group-hover:text-accent">
                      {next.title}
                    </div>
                  </Link>
                )}
              </nav>
            )}

            {/* 同目录其他 */}
            {siblings.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-3 text-sm font-semibold text-text-muted">
                  同目录还有 {siblings.length} 篇
                </h2>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {siblings.slice(0, 8).map((n) => (
                    <Link
                      key={n.id}
                      href={`/notes/${n.id}`}
                      className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-text-secondary transition-colors hover:bg-bg-soft hover:text-accent"
                    >
                      <span className="h-1 w-1 shrink-0 rounded-full bg-accent/50" />
                      <span className="truncate">{n.title}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* ───────── 右：目录 TOC ───────── */}
        <aside className="hidden w-[272px] shrink-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto thin-scroll pl-1">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                本页目录
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                {Math.round(progress)}%
              </span>
            </div>
            {toc.length > 0 ? (
              tocList
            ) : (
              <p className="px-2 text-[12px] text-text-muted">本篇没有小标题</p>
            )}
            <Link
              href="/notes"
              className="mt-4 flex items-center gap-1.5 border-t border-border px-2 pt-3 text-[12px] text-text-muted transition-colors hover:text-accent"
            >
              <ArrowLeft className="h-3 w-3" />
              返回知识库
            </Link>
          </div>
        </aside>
      </div>

      {/* ───────── 小屏目录抽屉 ───────── */}
      {tocOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setTocOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[300px] max-w-[85vw] flex-col border-l border-border bg-bg-base p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">本页目录</span>
              <button
                onClick={() => setTocOpen(false)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-bg-soft hover:text-text-primary"
                aria-label="关闭目录"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto thin-scroll">{tocList}</div>
          </div>
        </div>
      )}
    </>
  );
}
