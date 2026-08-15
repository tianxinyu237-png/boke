import { getPostsFlat } from "@/lib/posts";
import type { Metadata } from "next";
import CategoriesContent from "./categories-content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "分类",
  description: "按分类浏览所有文章",
};

export default async function CategoriesPage() {
  return <CategoriesContent />;
}
