"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        返回笔记列表
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          {note.noteType === "mindmap" && <span className="text-lg">🧠</span>}
          {note.folder && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">{note.folder}</span>
          )}
          <span className="text-xs text-text-muted">{new Date(note.updatedAt).toLocaleDateString("zh-CN")}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{note.title}</h1>
      </div>

      {note.noteType === "mindmap" && note.htmlContent ? (
        <div className="border border-border rounded-2xl overflow-hidden" style={{ minHeight: "80vh" }}>
          <iframe srcDoc={note.htmlContent} className="w-full border-0" style={{ height: "80vh" }}
            title={note.title} sandbox="allow-scripts allow-same-origin" />
        </div>
      ) : (
        <article className="prose prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content || ""}</ReactMarkdown>
        </article>
      )}
    </div>
  );
}
