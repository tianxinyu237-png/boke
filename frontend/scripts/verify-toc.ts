import { renderMarkdown } from "../lib/highlight";
import { extractToc } from "../lib/toc";

async function main() {
  const md = [
    "## 一、快速开始",
    "",
    "正文内容。",
    "",
    "### 1.1 安装依赖",
    "",
    "```bash",
    "# 这一行的井号在代码块里，不该被当成标题",
    "npm install",
    "```",
    "",
    "## 二、City Skyline 与 中文混排",
    "",
    "正文。",
    "",
    "### 2.1 Duplicate 标题",
    "",
    "正文。",
    "",
    "### 2.1 Duplicate 标题",
    "",
    "重复标题，第二个应该拿到 -1 后缀。",
  ].join("\n");

  let html = "";
  try {
    html = await renderMarkdown(md);
  } catch (e) {
    console.error("渲染失败:", e);
    process.exit(1);
  }

  console.log("═══════ 渲染出的标题 + id ═══════");
  const re = /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/g;
  let m: RegExpExecArray | null;
  const ids: string[] = [];
  while ((m = re.exec(html)) !== null) {
    const idm = /\bid="([^"]*)"/.exec(m[2]);
    const id = idm ? idm[1] : "(无 id!)";
    const text = m[3].replace(/<[^>]+>/g, "");
    ids.push(id);
    console.log(`  h${m[1]}  id="${id}"   text="${text}"`);
  }

  console.log("\n═══════ extractToc 产出的链接 ═══════");
  const toc = extractToc(md, 3);
  for (const t of toc) console.log(`  h${t.level}  #${t.id}   ${t.text}`);

  console.log("\n═══════ 一致性校验 ═══════");
  let allMatch = true;
  for (const t of toc) {
    const hit = ids.includes(t.id);
    if (!hit) allMatch = false;
    console.log(`  ${hit ? "OK " : "✗ 锚点断裂"}  #${t.id}`);
  }
  console.log(allMatch ? "\n结果：TOC 全部锚点都有对应元素" : "\n结果：存在断裂锚点");

  const badHeading = /<h[1-6][^>]*>[^<]*井号/.test(html);
  console.log("代码块井号未误判为标题:", badHeading ? "✗ 失败" : "✓ 通过");
}

main();
