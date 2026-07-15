import type { Metadata } from "next";

import { BooksPage as BooksPageView } from "@/features/books/books-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getLocalizedSiteConfig } from "@/lib/site-config";

const identity = getLocalizedSiteConfig("zh-CN");

export const metadata: Metadata = buildPageMetadata({
  description: identity.sectionDescriptions.books,
  locale: "zh-CN",
  pathname: "/books/",
  title: "图书与长文",
});

export default function BooksPage() {
  return <BooksPageView locale="zh-CN" />;
}
