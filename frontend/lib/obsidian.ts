// Obsidian → 站内可渲染 markdown 的转换层
//
// 处理三类语法:
//   1. callout   > [!tip] 标题      → 引用块首行 "💡 **标题**"
//   2. 双链      [[笔记名]] / [[笔记名|显示]]  → [显示](/notes/id)
//   3. 嵌入图片  ![[x.png|420]]      → 已在导入时转成 <img>(rehype-raw 负责渲染)

const CALLOUT_ICONS: Record<string, string> = {
  note: "📝",
  tip: "💡",
  warning: "⚠️",
  danger: "🔴",
  success: "✅",
  info: "ℹ️",
  important: "❗",
  abstract: "📋",
  example: "🧪",
  quote: "💬",
};

/**
 * 把 Obsidian callout 标记换成「emoji + 粗体标题」的普通引用块。
 * 每个内容行开头的 "> " 保持不变,markdown 会正常解析成 blockquote。
 */
export function convertCallouts(md: string): string {
  return md.replace(/^([ \t]*)>\s*\[!(\w+)\][+-]?\s*(.*)$/gm, (_m, indent, type, title) => {
    const icon = CALLOUT_ICONS[(type || "").toLowerCase()] || CALLOUT_ICONS.note;
    const t = (title || "").trim();
    return t ? `${indent}> ${icon} **${t}**` : `${indent}> ${icon}`;
  });
}

/**
 * 把 Obsidian 双链转成站内链接。
 * titleToHref: 笔记标题 → /notes/{id};找不到的用粗体文字兜底(保留可读性)。
 * 支持 ![[name]] 之外的普通双链和带显示名的形式。
 */
export function convertWikiLinks(
  md: string,
  titleToHref: Record<string, string>
): string {
  return md.replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_m, name, alias) => {
    const key = String(name).trim();
    const label = String(alias ?? key).trim();
    const href = titleToHref[key];
    if (href) return `[${label}](${href})`;
    // 未找到目标笔记:保留文字但不再像链接,避免死链
    return `**${label}**`;
  });
}

/** 采集 markdown 里出现的所有双链目标(用于提示缺失笔记) */
export function collectWikiLinkTargets(md: string): string[] {
  const out = new Set<string>();
  const re = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) out.add(m[1].trim());
  return Array.from(out);
}

/** 一次性处理:callout + 双链 */
export function prepareNoteMarkdown(
  md: string,
  titleToHref: Record<string, string>
): string {
  return convertWikiLinks(convertCallouts(md || ""), titleToHref);
}
