"use client";

import PostEditor from "@/components/admin/post-editor";
import { createPost, type PostData } from "@/lib/admin/api";
import { useRouter } from "next/navigation";

export default function NewPostPage() {
  const router = useRouter();

  const handleSave = async (data: PostData) => {
    await createPost(data);
    router.push("/admin/dashboard");
  };

  return <PostEditor mode="create" onSave={handleSave} />;
}
