import { Chip } from "@heroui/react/chip";
import { ArrowUpRight, Clock3, ListOrdered } from "lucide-react";

import { SiteLink } from "@/components/ui/site-link";
import { booksContent, formatBookContent } from "@/features/books/book-content";
import {
  formatBookDate,
  getBookChapterHref,
  getBookHref,
} from "@/features/books/book-links";
import { getPublishedBookChapters } from "@/lib/content/queries";
import type { Book } from "@/lib/content/types";
import { siteConfig } from "@/lib/site-config";

interface BookCardProps {
  readonly book: Book;
  readonly index: number;
}

export function BookCard({ book, index }: BookCardProps) {
  const content = booksContent[book.locale];
  const href = getBookHref(book.locale, book.slug);
  const chapters = getPublishedBookChapters(book);
  const previewChapters = chapters.slice(0, 2);
  const status =
    book.status === "complete" ? content.complete : content.serializing;
  const updated = book.updated ?? book.published;

  return (
    <article className="book-item">
      <SiteLink aria-label={book.title} className="book-cover" href={href}>
        <span>
          {siteConfig.brand.bookLabel} / {String(index + 1).padStart(2, "0")}
        </span>
        <strong>{book.title}</strong>
      </SiteLink>
      <div className="book-card-content">
        <header>
          <h2>
            <SiteLink href={href}>{book.title}</SiteLink>
          </h2>
          <Chip size="sm" variant="soft">
            {status}
          </Chip>
        </header>
        {book.author || book.translator ? (
          <div className="book-card-byline">
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
        <div className="book-card-facts">
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
        {previewChapters.length > 0 ? (
          <nav aria-label={content.chapters} className="book-chapters-preview">
            {previewChapters.map((chapter) => (
              <SiteLink
                href={getBookChapterHref(book.locale, book.slug, chapter.slug)}
                key={chapter.slug}
              >
                <span>{String(chapter.order).padStart(2, "0")}</span>
                {chapter.title}
              </SiteLink>
            ))}
          </nav>
        ) : null}
        <div className="book-card-footer">
          <div className="book-card-tags">
            {book.tags.slice(0, 3).map((tag) => (
              <Chip key={tag} size="sm">
                {tag}
              </Chip>
            ))}
          </div>
          <SiteLink className="article-link" href={href}>
            {content.openBook}
            <ArrowUpRight aria-hidden="true" />
          </SiteLink>
        </div>
      </div>
    </article>
  );
}
