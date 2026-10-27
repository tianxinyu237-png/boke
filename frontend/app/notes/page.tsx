import type { Metadata } from "next";
import NotesContent from "./notes-content";

export const metadata: Metadata = {
  title: "知识库",
  description: "本地 Obsidian 知识库镜像:嵌入式、项目、Skills 索引",
};

export const revalidate = 60;

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

async function getNotes(): Promise<NoteData[]> {
  try {
    // 服务端没有 base URL,必须走容器内网地址(和 lib/posts.ts 一致)
    const api =
      process.env.INTERNAL_API_URL ||
      (process.env.NODE_ENV === "production"
        ? "http://backend:8080/api"
        : "http://localhost:8080/api");
    // light=true:只取元数据 + 200 字预览,正文在详情页单独加载
    const res = await fetch(`${api}/notes?light=true`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function NotesPage() {
  const notes = await getNotes();
  return <NotesContent notes={notes} />;
}
