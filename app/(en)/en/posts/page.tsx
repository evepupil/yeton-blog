import type { Metadata } from "next";

import { PostsPage } from "@/features/posts/posts-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getLocalizedSiteConfig } from "@/lib/site-config";

const identity = getLocalizedSiteConfig("en");

export const metadata: Metadata = buildPageMetadata({
  description: identity.sectionDescriptions.posts,
  locale: "en",
  pathname: "/en/posts/",
  title: "Writing",
});

export default function EnglishPostsPage() {
  return <PostsPage locale="en" />;
}
