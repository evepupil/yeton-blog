import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookChapterPage } from "@/features/books/book-chapter-page";
import { decodeBookSegment } from "@/features/books/book-links";
import {
  findBookChapterTranslation,
  findPublishedBook,
  findPublishedBookChapter,
  getBookChapterNavigation,
  getPublishedBookChapters,
  getPublishedBooks,
} from "@/lib/content/queries";
import { getAllBooks } from "@/lib/content/repository";
import { buildBookChapterMetadata } from "@/lib/seo/content-metadata";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamicParams = false;

interface BookChapterRouteProps {
  readonly params: Promise<{ chapter: string; slug: string }>;
}

export async function generateStaticParams() {
  const books = getPublishedBooks(await getAllBooks(), "zh-CN");

  return books.flatMap((book) =>
    getPublishedBookChapters(book).map((chapter) => ({
      chapter: chapter.slug,
      slug: book.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: BookChapterRouteProps): Promise<Metadata> {
  const [segments, books] = await Promise.all([params, getAllBooks()]);
  const slug = decodeBookSegment(segments.slug);
  const chapterSlug = decodeBookSegment(segments.chapter);
  const book = findPublishedBook(books, "zh-CN", slug);
  const chapter = book ? findPublishedBookChapter(book, chapterSlug) : null;

  return book && chapter
    ? buildBookChapterMetadata(
        book,
        chapter,
        findBookChapterTranslation(books, book, chapter, "en"),
      )
    : buildPageMetadata({
        alternatePaths: {
          "zh-CN": `/books/${slug}/${chapterSlug}/`,
        },
        description: "这个地址没有对应的图书章节。",
        locale: "zh-CN",
        noIndex: true,
        pathname: `/books/${slug}/${chapterSlug}/`,
        title: "章节未找到",
      });
}

export default async function ChineseBookChapterPage({
  params,
}: BookChapterRouteProps) {
  const [segments, books] = await Promise.all([params, getAllBooks()]);
  const book = findPublishedBook(
    books,
    "zh-CN",
    decodeBookSegment(segments.slug),
  );
  const chapter = book
    ? findPublishedBookChapter(book, decodeBookSegment(segments.chapter))
    : null;

  if (!book || !chapter) {
    notFound();
  }

  return (
    <BookChapterPage
      book={book}
      chapter={chapter}
      navigation={getBookChapterNavigation(book, chapter)}
    />
  );
}
