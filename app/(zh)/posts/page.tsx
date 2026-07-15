import type { Metadata } from "next";

import { PostsPage as PostsPageView } from "@/features/posts/posts-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description: "按发布时间浏览林墨关于前端、AI 与独立开发的全部文章。",
  locale: "zh-CN",
  pathname: "/posts/",
  title: "所有文章",
});

export default function PostsPage() {
  return <PostsPageView locale="zh-CN" />;
}
