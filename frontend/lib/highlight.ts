import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";
import { codeToHtml } from "shiki";

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
