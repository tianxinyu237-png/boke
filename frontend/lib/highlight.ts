import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";
import { codeToHtml } from "shiki";
import { slugifyHeading } from "./toc";

/** 取 hast 节点的纯文本（递归拼接所有 text 子节点） */
function hastText(node: any): string {
  if (!node || typeof node !== "object") return "";
  if (node.type === "text") return String(node.value ?? "");
  if (Array.isArray(node.children)) return node.children.map(hastText).join("");
  return "";
}

/**
 * 给 h1~h6 写入 id（服务端渲染阶段就烘进 HTML）。
 *
 * 为什么必须在这里做、而不是客户端 useEffect 补：
 * 正文由 dangerouslySetInnerHTML 注入，React 每次重渲染都会用 post.content
 * 重新生成整段 DOM，客户端手工加的 id 会被冲掉 —— 于是 TOC 的 #锚点 永远指向
 * 不存在的元素。id 一旦进了服务端产出的 HTML 字符串，就不再依赖任何客户端补丁。
 *
 * id 规则复用 lib/toc.ts 的 slugifyHeading，与 extractToc() 产出的链接保持一致。
 */
function rehypeHeadingIds() {
  return (tree: any) => {
    const seen = new Map<string, number>();
    const walk = (node: any) => {
      if (!node || typeof node !== "object") return;
      if (node.type === "element" && /^h[1-6]$/.test(node.tagName)) {
        const text = hastText(node).trim();
        if (text) {
          const base = slugifyHeading(text);
          const n = seen.get(base) ?? 0;
          seen.set(base, n + 1);
          const id = n === 0 ? base : `${base}-${n}`;
          node.properties = node.properties ?? {};
          // 作者显式写了 id 就尊重它，不被自动规则覆盖
          if (!node.properties.id) node.properties.id = id;
        }
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    walk(tree);
  };
}

/**
 * Convert markdown to HTML, with KaTeX math and Shiki code highlighting.
 * Must be called in a server component or API route (uses Node.js APIs).
 */
export async function renderMarkdown(md: string): Promise<string> {
  // Step 1: Markdown → HTML with math support
  const html = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex)
    .use(rehypeRaw)
    .use(rehypeHeadingIds)
    .use(rehypeStringify)
    .process(md);

  const htmlStr = String(html);

  // Step 2: Highlight code blocks
  return highlightCodeBlocks(htmlStr);
}

/**
 * Transform HTML content by highlighting all <pre><code> blocks with Shiki.
 */
export async function highlightCodeBlocks(html: string): Promise<string> {
  // Match <pre><code class="language-xxx">...</code></pre> and <pre><code>...</code></pre>
  const regex = /<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g;

  const replacements: Array<{ index: number; original: string; highlighted: string }> = [];

  // Collect mermaid blocks first (don't highlight them)
  const mermaidBlocks: Array<{ original: string; code: string }> = [];
  const mermaidRegex = /<pre><code(?:\s+class="language-mermaid")?>([\s\S]*?)<\/code><\/pre>/g;
  let mm;
  while ((mm = mermaidRegex.exec(html)) !== null) {
    const code = mm[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    mermaidBlocks.push({ original: mm[0], code });
  }

  let match;
  while ((match = regex.exec(html)) !== null) {
    const lang = match[1] || "text";
    if (lang === "mermaid") continue; // handled separately
    const code = match[2]
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    try {
      const highlighted = await codeToHtml(code, {
        lang,
        themes: { dark: "github-dark", light: "github-light" },
        defaultColor: false,
      });
      // Tag the <pre> with its language so CSS can render a language badge
      const langAttr = lang === "text" ? "" : ` data-language="${lang}"`;
      const tagged = highlighted.replace("<pre ", `<pre${langAttr} `);
      replacements.push({
        index: match.index,
        original: match[0],
        highlighted: tagged,
      });
    } catch {
      // fallback: leave as-is
    }
  }

  // Apply replacements in reverse order to preserve indices
  let result = html;
  for (const r of replacements.reverse()) {
    result = result.slice(0, r.index) + r.highlighted + result.slice(r.index + r.original.length);
  }

  return result;
}
