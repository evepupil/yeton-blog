import type { Metadata } from "next";

import { PostsPage } from "@/features/posts/posts-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Browse all notes on frontend engineering, AI and independent building.",
  locale: "en",
  pathname: "/en/posts/",
  title: "Writing",
});

export default function EnglishPostsPage() {
  return <PostsPage locale="en" />;
}
