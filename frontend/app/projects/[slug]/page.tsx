import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProjectBySlugServer, loadProjectsConfigServer } from "@/lib/projects";
import { renderMarkdown } from "@/lib/highlight";
import ProjectDetailClient from "./project-detail-client";

export const revalidate = 300;

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = await getProjectBySlugServer(params.slug);
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

// Pre-render known project routes at build time so crawlers get full HTML
export async function generateStaticParams() {
  try {
    const cfg = await loadProjectsConfigServer();
    return cfg.projects
      .map((p) => p.slug)
      .filter((s): s is string => Boolean(s))
      .map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export default async function ProjectDetailPage({ params }: Params) {
  const project = await getProjectBySlugServer(params.slug);
  if (!project) notFound();

  let html = "";
  if (project.longDesc) {
    try {
      html = await renderMarkdown(project.longDesc);
    } catch {
      // Rendering failure → page still shows basic info
    }
  }

  return <ProjectDetailClient project={project} html={html} />;
}
