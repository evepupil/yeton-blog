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
  const books = getPublishedBooks(await getAllBooks(), "zh-CN");

  return books.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BookRouteProps): Promise<Metadata> {
  const [{ slug }, books] = await Promise.all([params, getAllBooks()]);
  const book = findPublishedBook(books, "zh-CN", slug);

  return book
    ? { description: book.description, title: book.title }
    : { title: "图书未找到" };
}

export default async function ChineseBookPage({ params }: BookRouteProps) {
  const [{ slug }, books] = await Promise.all([params, getAllBooks()]);
  const book = findPublishedBook(books, "zh-CN", slug);

  if (!book) {
    notFound();
  }

  return <BookDetailPage book={book} />;
}
