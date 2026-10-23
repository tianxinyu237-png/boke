import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProjectBySlugServer, loadProjectsConfigServer } from "@/lib/projects";
import ProjectDetailClient from "./project-detail-client";

export const dynamic = "force-dynamic";

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = await getProjectBySlugServer(params.slug).catch(() => null);
  if (!project) return { title: "项目未找到" };
  return {
    title: project.name,
    description: project.desc,
    openGraph: {
      title: project.name,
      description: project.desc,
      type: "article",
    },
  };
}

export default async function ProjectDetailPage({ params }: Params) {
  const project = await getProjectBySlugServer(params.slug);
  if (!project) notFound();

  // Markdown body is rendered on the client via /render-markdown
  // (keeps heavy shiki work out of the server render path).
  return <ProjectDetailClient project={project} html="" />;
}
