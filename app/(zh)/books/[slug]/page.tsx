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
  const books = getPublishedBooks(await getAllBooks(), "zh-CN");

  return books.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BookRouteProps): Promise<Metadata> {
  const [{ slug }, books] = await Promise.all([params, getAllBooks()]);
  const book = findPublishedBook(books, "zh-CN", slug);

  return book
    ? buildBookMetadata(book, findBookTranslation(books, book, "en"))
    : buildPageMetadata({
        alternatePaths: { "zh-CN": `/books/${slug}/` },
        description: "这个地址没有对应的图书。",
        locale: "zh-CN",
        noIndex: true,
        pathname: `/books/${slug}/`,
        title: "图书未找到",
      });
}

export default async function ChineseBookPage({ params }: BookRouteProps) {
  const [{ slug }, books] = await Promise.all([params, getAllBooks()]);
  const book = findPublishedBook(books, "zh-CN", slug);

  if (!book) {
    notFound();
  }

  return <BookDetailPage book={book} />;
}
