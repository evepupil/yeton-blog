import type { Metadata } from "next";

import { BooksPage } from "@/features/books/books-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getLocalizedSiteConfig } from "@/lib/site-config";

const identity = getLocalizedSiteConfig("en");

export const metadata: Metadata = buildPageMetadata({
  description: identity.sectionDescriptions.books,
  locale: "en",
  pathname: "/en/books/",
  title: "Books and long reads",
});

export default function EnglishBooksPage() {
  return <BooksPage locale="en" />;
}
