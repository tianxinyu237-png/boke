"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowsClockwise,
  ClockCounterClockwise,
  FolderSimple,
  Notebook,
} from "@phosphor-icons/react";

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

/* 右栏三面翻转卡：学「奶油小屋」hc-card 的思路 —— 多个挂件叠进一个卡位 */
const CARD_FACES = [
  { key: "stats", label: "统计" },
  { key: "recent", label: "最近" },
  { key: "folders", label: "目录" },
] as const;

const FACE_ANGLE = 360 / CARD_FACES.length; // 120deg

/** 每面的 3D 定位：绕着 Y 轴均分 + 沿法线外推半径 */
function faceStyle(index: number, radius: number) {
  return {
    transform: `rotateY(${index * FACE_ANGLE}deg) translateZ(${radius}px)`,
    backfaceVisibility: "hidden" as const,
    WebkitBackfaceVisibility: "hidden" as const,
  };
}

export default function NotesContent({ notes }: { notes: NoteData[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  // 相对时间依赖 Date.now()，服务端与客户端必然不一致 → 挂载后才渲染
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 翻转卡：当前面 + 舞台半径（响应式，宽度变化时重算）
  const [face, setFace] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(83);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () =>
      setRadius(Math.max(60, el.offsetWidth / (2 * Math.tan(Math.PI / 3))));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* 目录树：把 folder 路径拆层级 + 累计子目录篇数 */
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

  /* 直接从 ISO 串取月.日（和文章归档页一致的 MM.DD 写法），
     避免 new Date() 在服务端/客户端因时区不同而渲染出不同日期 */
  function noteParts(iso: string) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    if (m) return { y: m[1], m: m[2], d: m[3] };
    const dt = new Date(iso);
    return {
      y: String(dt.getFullYear()),
      m: String(dt.getMonth() + 1).padStart(2, "0"),
      d: String(dt.getDate()).padStart(2, "0"),
    };
  }

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

  /* 右栏数据：最近更新 + 本周新增 + 随机漫游 */
  const recent = useMemo(
    () =>
      [...notes]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 6),
    [notes]
  );

  function randomNote() {
    if (!notes.length) return;
    router.push(`/notes/${notes[Math.floor(Math.random() * notes.length)].id}`);
  }

  const stats = [
    { icon: Notebook, label: "篇笔记", value: notes.length },
    { icon: FolderSimple, label: "个目录", value: totalFolders },
  ];

  /* 一级目录 TOP6 + 归一化基准 */
  const topFolders = useMemo(() => {
    const roots = folderNodes.filter((n) => n.path !== "" && n.depth === 0);
    const max = Math.max(...roots.map((x) => x.count), 1);
    return {
      list: [...roots].sort((a, b) => b.count - a.count).slice(0, 6),
      max,
    };
  }, [folderNodes]);

  /* 相对时间：避免依赖"本周新增"（同步会刷新 updatedAt，早期统计不可靠） */
  function relTime(iso?: string): string {
    if (!iso) return "—";
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return "—";
    const m = Math.floor((Date.now() - t) / 60000);
    if (m < 1) return "刚刚";
    if (m < 60) return `${m} 分钟前`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} 小时前`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d} 天前`;
    return new Date(iso).toLocaleDateString("zh-CN");
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-12 sm:px-6 lg:px-8">
      {/* 页头：与文章归档页同一套语言 —— 英文小字大写 + 霞鹜文楷大标题 */}
      <header className="mb-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-text-muted">
          Knowledge Base / Notes Index
        </p>
        <h1 className="mt-3 font-wenkai text-[clamp(28px,4vw,40px)] leading-[1.1] tracking-[-0.02em] text-text-primary">
          知识库
        </h1>
        <p className="mt-3 text-[13px] text-text-muted">
          {notes.length} 篇 · {totalFolders} 个目录 · 来自本地 Obsidian vault
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* ───── 左：目录树 ───── */}
        <aside className="lg:w-[228px] lg:shrink-0">
          <div className="lg:sticky lg:top-20">
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              目录
            </div>
            <nav className="no-scrollbar flex flex-row gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              <button
                onClick={() => setActiveFolder(null)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                  activeFolder === null
                    ? "bg-accent/15 font-medium text-accent"
                    : "text-text-secondary hover:bg-bg-soft hover:text-text-primary"
                }`}
              >
                全部 <span className="text-[11px] text-text-muted">{notes.length}</span>
              </button>
              {folderNodes.map((node) => (
                <button
                  key={node.path || "__root"}
                  onClick={() =>
                    setActiveFolder(activeFolder === node.path ? null : node.path)
                  }
                  style={{ paddingLeft: `${10 + node.depth * 12}px` }}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg py-1.5 pr-2.5 text-left text-[13px] transition-colors ${
                    activeFolder === node.path
                      ? "bg-accent/15 font-medium text-accent"
                      : "text-text-secondary hover:bg-bg-soft hover:text-text-primary"
                  }`}
                >
                  <span className="truncate">{node.label}</span>
                  <span className="shrink-0 text-[11px] text-text-muted">{node.count}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ───── 中：搜索 + 列表 ───── */}
        <div className="min-w-0 flex-1">
          <div className="relative mb-5">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标题或正文..."
              className="w-full rounded-xl border border-border bg-bg-soft py-2.5 pl-10 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
          </div>

          {visible.length === 0 && (
            <p className="py-12 text-center text-sm text-text-muted">没有匹配的内容</p>
          )}

          <div className="mt-2">
            {grouped.map(([folder, items]) => (
              <section key={folder || "__root"} className="mt-9 first:mt-0">
                {/* 组头：仿文章归档页的年份行（名称 + 篇数 + 拉通分隔线） */}
                {grouped.length > 1 && (
                  <div className="flex items-baseline gap-3 border-b border-border pb-2.5">
                    <h2 className="font-mono text-[16px] font-semibold tracking-tight text-text-primary">
                      {folder || "根目录"}
                    </h2>
                    <span className="text-[11px] text-text-muted">
                      {String(items.length).padStart(2, "0")} 篇
                    </span>
                    <span className="h-px flex-1 bg-border/60" />
                  </div>
                )}

                <ol>
                  {items.map((note) => {
                    const d = noteParts(note.updatedAt);
                    return (
                      <li key={note.id}>
                        {/* 索引行（无卡片、无圆角、无底色）：日期列 + 标题 + 摘要，
                            和文章归档页的条目同一套排布 */}
                        <Link
                          href={`/notes/${note.id}`}
                          className="group grid grid-cols-[38px_1fr] items-baseline gap-x-4 border-b border-border/40 py-3.5 transition-colors hover:border-accent/30 sm:grid-cols-[44px_1fr]"
                        >
                          <time
                            dateTime={note.updatedAt}
                            className="font-mono text-[11.5px] text-text-muted"
                          >
                            {d.m}.{d.d}
                          </time>
                          <div className="min-w-0">
                            <h3 className="font-wenkai text-[15.5px] leading-snug text-text-primary transition-colors group-hover:text-accent">
                              {note.noteType === "mindmap" && "🧠 "}
                              {note.title || "无标题"}
                            </h3>
                            <p className="mt-1 truncate text-[11.5px] leading-relaxed text-text-muted">
                              {preview(note.content)}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        </div>

        {/* ───── 右：三面翻转卡（统计 / 最近更新 / 目录分布）───── */}
        <aside className="lg:w-[288px] lg:shrink-0">
          <div className="lg:sticky lg:top-20">
            {/* 面切换标签 */}
            <div className="mb-2 flex items-center gap-1">
              {CARD_FACES.map((f, i) => (
                <button
                  key={f.key}
                  onClick={() => setFace(i)}
                  aria-pressed={face === i}
                  className={`flex-1 rounded-md px-2 py-1 text-[10.5px] font-medium transition-colors ${
                    face === i
                      ? "bg-accent/15 text-accent"
                      : "text-text-muted hover:bg-bg-soft hover:text-text-secondary"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* 3D 翻转舞台 */}
            <div ref={stageRef} className="flip-stage">
              <div
                className="flip-cube"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `rotateY(${-face * FACE_ANGLE}deg)`,
                }}
              >
                {/* 面 0 · 统计 */}
                <div
                  className="flip-face rounded-2xl border border-border bg-bg-soft p-4"
                  style={faceStyle(0, radius)}
                >
                  <div className="flex h-full flex-col">
                    <div className="grid flex-1 grid-cols-2 place-content-center gap-3">
                      {stats.map((s) => (
                        <div key={s.label} className="flex flex-col items-center gap-1">
                          <s.icon className="h-4 w-4 text-accent" />
                          <span className="font-mono text-lg font-semibold leading-none text-text-primary">
                            {s.value}
                          </span>
                          <span className="text-[10px] text-text-muted">{s.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-2.5 text-[11px]">
                      <span className="text-text-muted">最近更新</span>
                      <span className="text-text-secondary">
                        {mounted ? relTime(recent[0]?.updatedAt) : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 面 1 · 最近更新 */}
                <div
                  className="flip-face rounded-2xl border border-border bg-bg-soft p-4"
                  style={faceStyle(1, radius)}
                >
                  <div className="flex h-full flex-col">
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      <ClockCounterClockwise className="h-3.5 w-3.5" />
                      最近更新
                    </div>
                    <div className="thin-scroll -mr-1 flex-1 overflow-y-auto pr-1">
                      <div className="flex flex-col gap-0.5">
                        {recent.map((n) => (
                          <Link
                            key={n.id}
                            href={`/notes/${n.id}`}
                            className="group rounded-md px-1.5 py-1.5 text-[12.5px] text-text-secondary transition-colors hover:bg-bg-base hover:text-accent"
                          >
                            <div className="truncate">{n.title}</div>
                            <div className="text-[10px] text-text-muted">
                              {n.updatedAt &&
                                new Date(n.updatedAt).toLocaleDateString("zh-CN", {
                                  timeZone: "Asia/Shanghai",
                                })}
                              {n.folder ? ` · ${n.folder.split("/").pop()}` : ""}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 面 2 · 目录分布 */}
                <div
                  className="flip-face rounded-2xl border border-border bg-bg-soft p-4"
                  style={faceStyle(2, radius)}
                >
                  <div className="flex h-full flex-col">
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      <FolderSimple className="h-3.5 w-3.5" />
                      目录分布
                    </div>
                    <div className="thin-scroll -mr-1 flex-1 overflow-y-auto pr-1">
                      <div className="flex flex-col gap-1.5">
                        {topFolders.list.map((n) => (
                          <button
                            key={n.path}
                            onClick={() => setActiveFolder(n.path)}
                            className="group text-left"
                          >
                            <div className="mb-0.5 flex items-baseline justify-between gap-2">
                              <span className="truncate text-[12px] text-text-secondary group-hover:text-accent">
                                {n.label}
                              </span>
                              <span className="shrink-0 font-mono text-[10px] text-text-muted">
                                {n.count}
                              </span>
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-bg-base">
                              <div
                                className="h-full rounded-full bg-accent/60 transition-all"
                                style={{ width: `${(n.count / topFolders.max) * 100}%` }}
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 随机漫游：常驻在卡外，不参与翻转 */}
            <button
              onClick={randomNote}
              className="group mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-[13px] font-medium text-accent transition-colors hover:bg-accent/20"
            >
              <ArrowsClockwise className="h-4 w-4 transition-transform group-hover:rotate-180" />
              随机漫游一篇
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
