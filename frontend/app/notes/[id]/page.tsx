import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NoteDetailClient from "./note-detail-client";

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

async function getNote(id: string): Promise<NoteData | null> {
  try {
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
    const res = await fetch(`${api}/notes/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const note = await getNote(id);
  if (!note) return { title: "笔记未找到" };
  return { title: note.title, description: note.content?.slice(0, 160) || "" };
}

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = await getNote(id);
  if (!note) notFound();
  return <NoteDetailClient note={note} />;
}
