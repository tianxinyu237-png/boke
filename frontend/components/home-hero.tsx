"use client";

import { SITE } from "@/lib/config";

interface NoteBrief {
  id: number;
  title: string;
  folder: string;
}

/**
 * 首页 Hero —— 参考 blog.liveout.cn 的编辑体排版
 *
 * 设计要点（和旧版 HeroSection 的区别）：
 * · 视觉主体只有一个：霞鹜文楷（LXGW WenKai Lite）超大标题，字距收紧
 * · 没有技术栈徽章、没有 CTA 按钮群、没有插画 —— 元素越少，字越立得住
 * · 右栏不是装饰，是「活的东西」：最近笔记标题自动纵向滚动（对应它的歌词栏）
 * · 音乐交给右下角的浮窗 VinylPlayer，Hero 不重复承担
 */
export default function HomeHero({
  notes,
  postCount,
  noteCount,
}: {
  notes: NoteBrief[];
  postCount: number;
  noteCount: number;
}) {
  // 渲染两份实现无缝循环：动画 translateY(-50%) 正好回到起点
  const loop = [...notes, ...notes];

  return (
    <section className="relative overflow-hidden">
      {/* 极淡的暖光，只在标题左侧晕开，不抢字 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 45% at 22% 42%, rgb(var(--color-accent) / 0.10) 0%, transparent 62%)," +
            "radial-gradient(ellipse 38% 40% at 78% 62%, rgb(var(--color-accent-secondary) / 0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-14 px-6 pb-16 pt-20 sm:px-8 lg:min-h-[82vh] lg:flex-row lg:items-center lg:justify-between lg:gap-20 lg:px-10 lg:pt-24">
        {/* ── 左：大字标题 ── */}
        <div className="min-w-0 max-w-[880px]">
          <h1 className="font-wenkai text-[clamp(40px,6.4vw,112px)] font-normal leading-[1.08] tracking-[-0.035em] text-text-primary">
            {SITE.description}
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-text-secondary sm:mt-7 sm:text-lg">
            {SITE.tagline}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-text-muted">
            <span>{postCount} 篇文章</span>
            <span className="h-px w-7 bg-border" />
            <span>{noteCount} 篇笔记</span>
            <span className="h-px w-7 bg-border" />
            <span className="text-accent/80">持续更新</span>
          </div>
        </div>

        {/* ── 右：最近笔记，纵向自动滚动 ── */}
        <aside className="w-full shrink-0 lg:w-[320px]">
          <div className="mb-3.5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-text-muted">
            <span className="h-1 w-1 rounded-full bg-accent" />
            知识库 · 最近
          </div>

          <div
            className="relative h-[310px] overflow-hidden sm:h-[360px]"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
            }}
          >
            <div className="notes-marquee flex flex-col">
              {loop.map((n, i) => (
                <a
                  key={`${n.id}-${i}`}
                  href={`/notes/${n.id}`}
                  className="mb-3.5 block text-[16.5px] leading-snug text-text-secondary transition-colors hover:text-accent"
                >
                  <span className="line-clamp-2">{n.title}</span>
                  <span className="mt-1 block text-[9.5px] uppercase tracking-[0.16em] text-text-muted">
                    {n.folder || "根目录"}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
