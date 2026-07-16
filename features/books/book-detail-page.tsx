import { Chip } from "@heroui/react/chip";
import { ArrowLeft, ArrowRight, Clock3, ListOrdered } from "lucide-react";

import { SiteLink } from "@/components/ui/site-link";
import { booksContent, formatBookContent } from "@/features/books/book-content";
import {
  formatBookDate,
  getBookChapterHref,
} from "@/features/books/book-links";
import { MarkdownContent } from "@/features/posts/markdown-content";
import { getPublishedBookChapters } from "@/lib/content/queries";
import type { Book } from "@/lib/content/types";
import { getLocalizedPath } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";

interface BookDetailPageProps {
  readonly book: Book;
}

export function BookDetailPage({ book }: BookDetailPageProps) {
  const content = booksContent[book.locale];
  const booksHref = getLocalizedPath("/books/", book.locale);
  const chapters = getPublishedBookChapters(book);
  const firstChapter = chapters[0];
  const status =
    book.status === "complete" ? content.complete : content.serializing;
  const updated = book.updated ?? book.published;

  return (
    <main className="book-detail-page">
      <header className="shell book-detail-header">
        <SiteLink className="article-back-link" href={booksHref}>
          <ArrowLeft aria-hidden="true" />
          {content.back}
        </SiteLink>
        <div className="book-detail-hero">
          <div aria-hidden="true" className="book-cover book-detail-cover">
            <span>{siteConfig.brand.bookLabel} / LONGFORM</span>
            <strong>{book.title}</strong>
          </div>
          <div className="book-detail-copy">
            <Chip size="sm" variant="soft">
              {status}
            </Chip>
            <h1>{book.title}</h1>
            {book.author || book.translator ? (
              <div className="book-detail-meta">
                {book.author ? (
                  <span>
                    {content.author} · {book.author}
                  </span>
                ) : null}
                {book.translator ? (
                  <span>
                    {content.translator} · {book.translator}
                  </span>
                ) : null}
              </div>
            ) : null}
            <p>{book.description}</p>
            <div className="book-detail-facts">
              <span>
                <ListOrdered aria-hidden="true" />
                {formatBookContent(content.chapterCount, {
                  count: chapters.length,
                })}
              </span>
              {updated ? (
                <time dateTime={updated}>
                  <Clock3 aria-hidden="true" />
                  {content.updated} {formatBookDate(updated, book.locale)}
                </time>
              ) : null}
            </div>
            <div className="book-detail-tags">
              {book.tags.map((tag) => (
                <Chip className="book-detail-tag" key={tag} size="sm">
                  #{tag}
                </Chip>
              ))}
            </div>
            {firstChapter ? (
              <SiteLink
                className="book-start-link"
                href={getBookChapterHref(
                  book.locale,
                  book.slug,
                  firstChapter.slug,
                )}
              >
                {content.startReading}
                <ArrowRight aria-hidden="true" />
              </SiteLink>
            ) : null}
          </div>
        </div>
      </header>

      <div className="shell book-detail-body">
        <section className="book-introduction">
          <h2>{content.introduction}</h2>
          <MarkdownContent markdown={book.body} />
        </section>
        <section className="book-directory">
          <div className="book-section-heading">
            <h2>{content.chapters}</h2>
            <span>
              {formatBookContent(content.chapterCount, {
                count: chapters.length,
              })}
            </span>
          </div>
          <ol>
            {chapters.map((chapter) => (
              <li key={chapter.slug}>
                <SiteLink
                  href={getBookChapterHref(
                    book.locale,
                    book.slug,
                    chapter.slug,
                  )}
                >
                  <span>{String(chapter.order).padStart(2, "0")}</span>
                  <strong>{chapter.title}</strong>
                  <ArrowRight aria-hidden="true" />
                </SiteLink>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
