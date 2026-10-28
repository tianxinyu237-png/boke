"use client";

import Link from "next/link";

interface NoteItem {
  id: number;
  title: string;
  content: string;
  folder: string;
  updatedAt: string;
}

interface PostItem {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category?: { name: string } | null;
}

interface ProjectItem {
  name: string;
  desc: string;
  tags: string[];
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/* 直接从 ISO 串取年月日，避免时区差异导致 hydration 不一致 */
function parts(dateStr: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr || "");
  if (m) return { y: m[1], m: m[2], d: m[3] };
  const dt = new Date(dateStr);
  return {
    y: String(dt.getFullYear()),
    m: String(dt.getMonth() + 1).padStart(2, "0"),
    d: String(dt.getDate()).padStart(2, "0"),
  };
}

function preview(content: string): string {
  if (!content) return "";
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#*`~>|[\]()!_\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 110);
}

type StreamItem = {
  key: string;
  kind: "post" | "note" | "project";
  title: string;
  excerpt: string;
  href: string;
  date: string | null;
  meta: string;
};

/**
 * 首页时间流 —— 参考 blog.liveout.cn 的 RECENT SIGNALS
 *
 * 和旧首页的分区式排布（精选项目 / 最新文章）不同，这里把
 * 项目、文章、笔记混进同一条时间线，用左侧大字日期做锚点。
 * 「类型」靠一行小字大写标签区分，不靠卡片样式区分。
 */
export default function HomeStream({
  posts,
  notes,
  projects,
}: {
  posts: PostItem[];
  notes: NoteItem[];
  projects: ProjectItem[];
}) {
  const items: StreamItem[] = [
    // 项目没有日期，作为「NOW」置顶在流的开头
    ...projects.slice(0, 1).map((p) => ({
      key: `project-${p.name}`,
      kind: "project" as const,
      title: p.name,
      excerpt: p.desc,
      href: "/projects",
      date: null,
      meta: (p.tags || []).slice(0, 2).join(" · ") || "在做",
    })),
    ...posts.map((p) => ({
      key: `post-${p.slug}`,
      kind: "post" as const,
      title: p.title,
      excerpt: p.excerpt,
      href: `/posts/${p.slug}`,
      date: p.date,
      meta: p.category?.name || "文章",
    })),
    ...notes.map((n) => ({
      key: `note-${n.id}`,
      kind: "note" as const,
      title: n.title,
      excerpt: preview(n.content),
      href: `/notes/${n.id}`,
      date: n.updatedAt,
      meta: n.folder || "根目录",
    })),
  ];

  // NOW 置顶，其余按日期倒序
  const sorted = items.sort((a, b) => {
    if (!a.date && b.date) return -1;
    if (a.date && !b.date) return 1;
    if (!a.date && !b.date) return 0;
    return new Date(b.date!).getTime() - new Date(a.date!).getTime();
  });

  const shown = sorted.slice(0, 12);

  const KIND_LABEL: Record<StreamItem["kind"], string> = {
    post: "文章 / ARTICLE",
    note: "笔记 / NOTE",
    project: "项目 / PROJECT",
  };

  return (
    <section className="mx-auto w-full max-w-[760px] px-6 pb-20 pt-4">
      {/* 区块头：英文大写小字 + 中文 */}
      <header className="mb-1 flex items-baseline justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
            Recent Signals
          </h2>
          <p className="mt-1 text-[15px] text-text-primary">最近更新</p>
        </div>
        <Link
          href="/sum"
          className="shrink-0 text-[11px] text-text-muted transition-colors hover:text-accent"
        >
          全部文章 →
        </Link>
      </header>

      <div className="flex flex-col">
        {shown.map((item) => {
          const d = item.date ? parts(item.date) : null;
          return (
            <Link
              key={item.key}
              href={item.href}
              className="group grid grid-cols-[58px_1fr] gap-x-5 border-b border-border/50 py-5 transition-colors hover:border-accent/40 sm:grid-cols-[66px_1fr] sm:gap-x-6"
            >
              {/* 日期锚点 */}
              <div className="leading-none">
                {d ? (
                  <>
                    <span className="block font-mono text-[21px] font-semibold text-text-secondary transition-colors group-hover:text-accent sm:text-[23px]">
                      {d.d}
                    </span>
                    <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.16em] text-text-muted">
                      {MONTHS[Number(d.m) - 1] || d.m}
                    </span>
                    <span className="mt-0.5 block text-[9px] tracking-[0.1em] text-text-muted/60">
                      {Number(d.m)}月
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
                      NOW
                    </span>
                    <span className="mt-1 block text-[9px] uppercase tracking-[0.16em] text-text-muted">
                      在做
                    </span>
                  </>
                )}
              </div>

              {/* 内容 */}
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center gap-2.5 text-[9px] font-medium uppercase tracking-[0.16em] text-text-muted">
                  <span className={item.kind === "project" ? "text-accent/80" : ""}>
                    {KIND_LABEL[item.kind]}
                  </span>
                  <span className="h-px flex-1 bg-border/60" />
                  <span className="max-w-[40%] truncate normal-case tracking-normal">
                    {item.meta}
                  </span>
                </div>

                <h3 className="font-wenkai text-[18px] leading-snug text-text-primary transition-colors group-hover:text-accent sm:text-[19.5px]">
                  {item.title}
                </h3>

                {item.excerpt ? (
                  <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-text-secondary/85">
                    {item.excerpt}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-3 text-[11px] text-text-muted">
        <Link href="/sum" className="transition-colors hover:text-accent">
          文章归档
        </Link>
        <span className="h-px w-6 bg-border" />
        <Link href="/notes" className="transition-colors hover:text-accent">
          知识库
        </Link>
        <span className="h-px w-6 bg-border" />
        <Link href="/projects" className="transition-colors hover:text-accent">
          项目
        </Link>
      </div>
    </section>
  );
}
