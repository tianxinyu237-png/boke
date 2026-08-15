import type { Metadata } from "next";
import LinksContent from "./links-content";

export const metadata: Metadata = {
  title: "友链",
  description: "朋友们和技术伙伴的博客",
};

export default function LinksPage() {
  return <LinksContent />;
}
