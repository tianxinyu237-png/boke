"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { prepareNoteMarkdown } from "@/lib/obsidian";

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

export default function NoteDetailClient({ note }: { note: NoteData }) {
  const router = useRouter();
  const [all, setAll] = useState<NoteData[]>([]);

  // 全量笔记用于解析双链 + 找同目录邻居
  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || "/api";
    fetch(`${api}/notes?light=true`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: NoteData[]) => setAll(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const titleToHref = useMemo(() => {
    const map: Record<string, string> = {};
    for (const n of all) map[n.title] = `/notes/${n.id}`;
    return map;
  }, [all]);

  const siblings = useMemo(
    () =>
      all.filter(
        (n) => n.id !== note.id && (n.folder || "") === (note.folder || "")
      ),
    [all, note]
  );

  const md = useMemo(
    () => prepareNoteMarkdown(note.content || "", titleToHref),
    [note.content, titleToHref]
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        返回知识库
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {note.noteType === "mindmap" && <span className="text-lg">🧠</span>}
          {note.folder && (
            <Link
              href="/notes"
              className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
            >
              {note.folder}
            </Link>
          )}
          <span className="text-xs text-text-muted">
            {new Date(note.updatedAt).toLocaleDateString("zh-CN")}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
          {note.title}
        </h1>
      </div>

      {note.noteType === "mindmap" && note.htmlContent ? (
        <div className="border border-border rounded-2xl overflow-hidden" style={{ minHeight: "80vh" }}>
          <iframe srcDoc={note.htmlContent} className="w-full border-0" style={{ height: "80vh" }}
            title={note.title} sandbox="allow-scripts allow-same-origin" />
        </div>
      ) : (
        <article className="prose prose-invert max-w-none kb-note-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {md}
          </ReactMarkdown>
        </article>
      )}

      {siblings.length > 0 && (
        <section className="mt-14 pt-8 border-t border-border">
          <h2 className="text-sm font-semibold text-text-muted mb-3">
            同目录还有 {siblings.length} 篇
          </h2>
          <div className="flex flex-col gap-2">
            {siblings.map((n) => (
              <Link
                key={n.id}
                href={`/notes/${n.id}`}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors py-1"
              >
                <span className="w-1 h-1 rounded-full bg-accent/50 shrink-0" />
                <span className="truncate">{n.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
