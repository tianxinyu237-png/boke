import { getPosts } from "@/lib/posts";
import HomeHero from "@/components/home-hero";
import HomeStream from "@/components/home-stream";
import VinylPlayer from "@/components/vinyl-player";
import { loadProjectsConfigServer } from "@/lib/projects";

/* 首页 = 大字 Hero + 单一时间流（参考 blog.liveout.cn） */
export const revalidate = 60;

interface NoteBrief {
  id: number;
  title: string;
  content: string;
  folder: string;
  updatedAt: string;
}

async function getNotes(): Promise<NoteBrief[]> {
  try {
    const api =
      process.env.INTERNAL_API_URL ||
      (process.env.NODE_ENV === "production"
        ? "http://backend:8080/api"
        : "http://localhost:8080/api");
    const res = await fetch(`${api}/notes?light=true`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [data, notes, projectsCfg] = await Promise.all([
    getPosts(0, 50),
    getNotes(),
    loadProjectsConfigServer(),
  ]);

  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  return (
    <>
      <HomeHero
        notes={recentNotes}
        postCount={data.posts.length}
        noteCount={notes.length}
      />

      <HomeStream posts={data.posts} notes={notes} projects={projectsCfg.projects} />

      {/* 浮窗唱片机：音乐功能独立于 Hero */}
      <VinylPlayer />
    </>
  );
}
