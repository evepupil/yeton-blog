import { PostsPage as PostsPageView } from "@/features/posts/posts-page";

export const metadata = { title: "所有文章" };

export default function PostsPage() {
  return <PostsPageView locale="zh-CN" />;
}
