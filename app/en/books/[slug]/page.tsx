import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookDetailPage } from "@/features/books/book-detail-page";
import { findPublishedBook, getPublishedBooks } from "@/lib/content/queries";
import { getAllBooks } from "@/lib/content/repository";

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
    ? { description: book.description, title: book.title }
    : { title: "Book not found" };
}

export default async function EnglishBookPage({ params }: BookRouteProps) {
  const [{ slug }, books] = await Promise.all([params, getAllBooks()]);
  const book = findPublishedBook(books, "en", slug);

  if (!book) {
    notFound();
  }

  return <BookDetailPage book={book} />;
}
