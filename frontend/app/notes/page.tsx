import type { Metadata } from "next";
import NotesContent from "./notes-content";

export const metadata: Metadata = {
  title: "笔记",
  description: "个人笔记与知识碎片",
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
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
    const res = await fetch(`${api}/notes`, { next: { revalidate: 60 } });
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
