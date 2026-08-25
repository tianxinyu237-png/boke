import { NextRequest, NextResponse } from "next/server";
import { renderMarkdown } from "@/lib/highlight";

// 项目详情页用的 Markdown 渲染接口(服务端执行 shiki,避免客户端打包 WASM/Node 依赖)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const md = typeof body?.md === "string" ? body.md.slice(0, 20000) : "";
    if (!md.trim()) return NextResponse.json({ html: "" });
    const html = await renderMarkdown(md);
    return NextResponse.json({ html });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "render failed" }, { status: 500 });
  }
}
