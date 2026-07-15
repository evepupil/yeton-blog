import type { Metadata } from "next";

import { BooksPage } from "@/features/books/books-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description: "Books and long-form guides in progress or complete.",
  locale: "en",
  pathname: "/en/books/",
  title: "Books and long reads",
});

export default function EnglishBooksPage() {
  return <BooksPage locale="en" />;
}
