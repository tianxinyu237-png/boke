/**
 * 封面解析（2026-10-28）
 *
 * 历史问题：各页面用 `post.coverImage || coverImage(post.slug)` 兜底，
 * 而 coverImage() 是 picsum.photos 外部随机图 —— 不可控、可能加载失败、
 * 而且和站点视觉毫无关系（4 篇里有 2 篇挂的是随机风景照）。
 *
 * 现在的规矩：picsum 一律视为「无封面」，返回 null，
 * 调用方走程序化封面（大字日期柱）或干脆不输出图片。
 */

/** 是否是「真实可用」的封面 URL（排除 picsum 占位图） */
export function isRealCover(url?: string | null): boolean {
  return !!url && !url.includes("picsum.photos");
}

/**
 * 解析文章封面。
 * @returns 可用 URL，或 null 表示无封面（调用方自行降级）
 */
export function resolveCover(
  cover?: string | null,
  fallback?: string | null
): string | null {
  if (isRealCover(cover)) return cover as string;
  if (isRealCover(fallback)) return fallback as string;
  return null;
}
