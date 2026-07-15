import type { Metadata } from "next";

import { BooksPage as BooksPageView } from "@/features/books/books-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description: "查看林墨正在连载或已经完成的图书与长文。",
  locale: "zh-CN",
  pathname: "/books/",
  title: "图书与长文",
});

export default function BooksPage() {
  return <BooksPageView locale="zh-CN" />;
}
