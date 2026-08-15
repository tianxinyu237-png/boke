import { getPosts, type PaginatedPosts } from "@/lib/posts";
import { PostListClient } from "@/components/post-list-client";
import HeroSection from "@/components/hero-section";
import VinylPlayer from "@/components/vinyl-player";

export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const SERVER_API = process.env.NEXT_PUBLIC_API_URL?.startsWith("/")
  ? "http://backend:8080/api"
  : API_BASE;
const isServer = typeof window === "undefined";
const API = isServer ? SERVER_API : API_BASE;

async function getCategories() {
  try {
    const res = await fetch(`${API}/categories`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function HomePage() {
  const [data, categories] = await Promise.all([
    getPosts(0, 50),
    getCategories(),
  ]);

  return (
    <>
      {/* Hero section with embedded music player */}
      <HeroSection />

      {/* Post list */}
      <div className="max-w-3xl mx-auto px-4 pb-24 pt-4">
        <PostListClient initialData={data} categories={categories} />
      </div>

      {/* Floating vinyl player (shares audio state with hero) */}
      <VinylPlayer />
    </>
  );
}
