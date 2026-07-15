import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookDetailPage } from "@/features/books/book-detail-page";
import {
  findBookTranslation,
  findPublishedBook,
  getPublishedBooks,
} from "@/lib/content/queries";
import { getAllBooks } from "@/lib/content/repository";
import { buildBookMetadata } from "@/lib/seo/content-metadata";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamicParams = false;

interface BookRouteProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const books = getPublishedBooks(await getAllBooks(), "en");

  return books.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BookRouteProps): Promise<Metadata> {
  const [{ slug }, books] = await Promise.all([params, getAllBooks()]);
  const book = findPublishedBook(books, "en", slug);

  return book
    ? buildBookMetadata(book, findBookTranslation(books, book, "zh-CN"))
    : buildPageMetadata({
        alternatePaths: { en: `/en/books/${slug}/` },
        description: "There is no book at this address.",
        locale: "en",
        noIndex: true,
        pathname: `/en/books/${slug}/`,
        title: "Book not found",
      });
}

export default async function EnglishBookPage({ params }: BookRouteProps) {
  const [{ slug }, books] = await Promise.all([params, getAllBooks()]);
  const book = findPublishedBook(books, "en", slug);

  if (!book) {
    notFound();
  }

  return <BookDetailPage book={book} />;
}
