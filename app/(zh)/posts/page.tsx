import type { Metadata } from "next";

import { PostsPage as PostsPageView } from "@/features/posts/posts-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getLocalizedSiteConfig } from "@/lib/site-config";

const identity = getLocalizedSiteConfig("zh-CN");

export const metadata: Metadata = buildPageMetadata({
  description: identity.sectionDescriptions.posts,
  locale: "zh-CN",
  pathname: "/posts/",
  title: "所有文章",
});

export default function PostsPage() {
  return <PostsPageView locale="zh-CN" />;
}
