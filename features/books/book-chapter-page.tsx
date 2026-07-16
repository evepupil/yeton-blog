import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  ChevronRight,
  List,
} from "lucide-react";

import { SiteLink } from "@/components/ui/site-link";
import { booksContent, formatBookContent } from "@/features/books/book-content";
import { getBookChapterHref, getBookHref } from "@/features/books/book-links";
import { MarkdownContent } from "@/features/posts/markdown-content";
import { getPublishedBookChapters } from "@/lib/content/queries";
import type {
  Book,
  BookChapter,
  BookChapterNavigation,
} from "@/lib/content/types";
import { getLocalizedPath } from "@/lib/i18n";

interface BookChapterPageProps {
  readonly book: Book;
  readonly chapter: BookChapter;
  readonly navigation: BookChapterNavigation;
}

export function BookChapterPage({
  book,
  chapter,
  navigation,
}: BookChapterPageProps) {
  const content = booksContent[book.locale];
  const chapters = getPublishedBookChapters(book);
  const booksHref = getLocalizedPath("/books/", book.locale);
  const bookHref = getBookHref(book.locale, book.slug);
  const chapterPosition = formatBookContent(content.chapter, {
    current: chapter.order,
    total: chapters.length,
  });

  return (
    <main className="book-chapter-page">
      <div className="shell book-chapter-layout">
        <aside aria-label={content.chapters} className="book-chapter-sidebar">
          <SiteLink className="book-sidebar-heading" href={bookHref}>
            <BookOpenText aria-hidden="true" />
            <span>
              <strong>{content.chapters}</strong>
              <small>{book.title}</small>
            </span>
          </SiteLink>
          <nav>
            {chapters.map((candidate) => (
              <SiteLink
                aria-current={
                  candidate.slug === chapter.slug ? "page" : undefined
                }
                className={
                  candidate.slug === chapter.slug ? "is-current" : undefined
                }
                href={getBookChapterHref(
                  book.locale,
                  book.slug,
                  candidate.slug,
                )}
                key={candidate.slug}
              >
                <span>{String(candidate.order).padStart(2, "0")}</span>
                {candidate.title}
              </SiteLink>
            ))}
          </nav>
        </aside>

        <article className="book-chapter-content">
          <nav aria-label="Breadcrumb" className="book-breadcrumbs">
            <SiteLink href={booksHref}>{content.title}</SiteLink>
            <ChevronRight aria-hidden="true" />
            <SiteLink href={bookHref}>{book.title}</SiteLink>
            <ChevronRight aria-hidden="true" />
            <span>{chapter.title}</span>
          </nav>

          <header className="book-chapter-header">
            <span>{chapterPosition}</span>
            <h1>{chapter.title}</h1>
          </header>

          <details className="book-mobile-directory">
            <summary>
              <List aria-hidden="true" />
              {content.chapters}
              <span>{chapterPosition}</span>
            </summary>
            <nav>
              {chapters.map((candidate) => (
                <SiteLink
                  aria-current={
                    candidate.slug === chapter.slug ? "page" : undefined
                  }
                  href={getBookChapterHref(
                    book.locale,
                    book.slug,
                    candidate.slug,
                  )}
                  key={candidate.slug}
                >
                  <span>{String(candidate.order).padStart(2, "0")}</span>
                  {candidate.title}
                </SiteLink>
              ))}
            </nav>
          </details>

          <div className="book-chapter-prose">
            <MarkdownContent markdown={chapter.body} />
          </div>

          <nav
            aria-label={content.chapters}
            className="book-chapter-navigation"
          >
            {navigation.previous ? (
              <SiteLink
                className="book-chapter-nav-link"
                href={getBookChapterHref(
                  book.locale,
                  book.slug,
                  navigation.previous.slug,
                )}
              >
                <ArrowLeft aria-hidden="true" />
                <span>
                  <small>{content.previousChapter}</small>
                  <strong>{navigation.previous.title}</strong>
                </span>
              </SiteLink>
            ) : (
              <span aria-hidden="true" />
            )}
            <SiteLink className="book-directory-link" href={bookHref}>
              <List aria-hidden="true" />
              {content.chapters}
            </SiteLink>
            {navigation.next ? (
              <SiteLink
                className="book-chapter-nav-link is-next"
                href={getBookChapterHref(
                  book.locale,
                  book.slug,
                  navigation.next.slug,
                )}
              >
                <span>
                  <small>{content.nextChapter}</small>
                  <strong>{navigation.next.title}</strong>
                </span>
                <ArrowRight aria-hidden="true" />
              </SiteLink>
            ) : null}
          </nav>

          <SiteLink className="book-chapter-back" href={bookHref}>
            <ArrowLeft aria-hidden="true" />
            {content.backToBook}
          </SiteLink>
        </article>
      </div>
    </main>
  );
}
