/**
 * 从 markdown 源码提取目录（TOC）。
 * 不依赖 DOM，SSR 也能用；与渲染层通过 DOM 后处理对齐 id。
 */

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

const RE_FENCE = /^\s*(```|~~~)/;
const RE_HEAD = /^(#{1,4})\s+(.*)$/;

/** 去掉行内 markdown 标记，得到纯文本（与 react-markdown 渲染出的文本一致） */
export function stripInlineMarkdown(s: string): string {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 标题 → 锚点 id（保留中文与字母数字，其余折叠成 -） */
export function slugifyHeading(text: string): string {
  const base = text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "section";
}

/**
 * 提取 h1~h3 作为目录。
 * 跳过代码围栏内的 # 注释，避免把代码里的 # 当标题。
 */
export function extractToc(md: string, maxLevel = 3): TocItem[] {
  const out: TocItem[] = [];
  const seen = new Map<string, number>();
  let fence = false;

  for (const raw of md.split("\n")) {
    if (RE_FENCE.test(raw)) {
      fence = !fence;
      continue;
    }
    if (fence) continue;

    const m = RE_HEAD.exec(raw.trim());
    if (!m) continue;

    const level = m[1].length;
    if (level > maxLevel) continue;

    const text = stripInlineMarkdown(m[2]);
    if (!text) continue;

    const base = slugifyHeading(text);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    out.push({ id: n === 0 ? base : `${base}-${n}`, text, level });
  }
  return out;
}

/** 目录树的节点（知识库左侧栏用） */
export interface KbFolderNode {
  path: string;
  label: string;
  depth: number;
  count: number;
  children: KbFolderNode[];
}

/** 由笔记的 folder 路径集合构建层级目录树（含累计篇数） */
export function buildFolderTree(
  notes: { folder?: string | null }[]
): KbFolderNode[] {
  type Raw = { count: number; children: Map<string, Raw> };
  const root: Raw = { count: 0, children: new Map() };

  for (const n of notes) {
    const folder = (n.folder || "").trim();
    if (!folder) continue;
    const parts = folder.split("/").filter(Boolean);
    let cur = root;
    for (const p of parts) {
      if (!cur.children.has(p)) {
        cur.children.set(p, { count: 0, children: new Map() });
      }
      cur = cur.children.get(p)!;
      cur.count += 1;
    }
  }

  const walk = (node: Raw, prefix: string, depth: number): KbFolderNode[] => {
    const arr: KbFolderNode[] = [];
    for (const [label, child] of node.children) {
      const path = prefix ? `${prefix}/${label}` : label;
      arr.push({
        path,
        label,
        depth,
        count: child.count,
        children: walk(child, path, depth + 1),
      });
    }
    return arr.sort((a, b) => a.label.localeCompare(b.label, "zh-CN"));
  };

  return walk(root, "", 0);
}
