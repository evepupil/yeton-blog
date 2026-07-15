import { Chip } from "@heroui/react/chip";
import { ArrowLeft } from "lucide-react";

import { SiteLink } from "@/components/ui/site-link";
import { booksContent } from "@/features/books/book-content";
import { BookProgress } from "@/features/books/book-progress";
import { ArticleToc } from "@/features/posts/article-toc";
import { MarkdownContent } from "@/features/posts/markdown-content";
import type { Book } from "@/lib/content/types";
import { getLocalizedPath } from "@/lib/i18n";

interface BookDetailPageProps {
  readonly book: Book;
}

export function BookDetailPage({ book }: BookDetailPageProps) {
  const content = booksContent[book.locale];
  const booksHref = getLocalizedPath("/books/", book.locale);
  const status =
    book.status === "complete" ? content.complete : content.serializing;

  return (
    <main className="book-detail-page">
      <header className="shell book-detail-header">
        <SiteLink className="article-back-link" href={booksHref}>
          <ArrowLeft aria-hidden="true" />
          {content.back}
        </SiteLink>
        <div className="book-detail-hero">
          <div aria-hidden="true" className="book-cover book-detail-cover">
            <span>LINMO BOOK / LONGFORM</span>
            <strong>{book.title}</strong>
          </div>
          <div className="book-detail-copy">
            <Chip size="sm" variant="soft">
              {status}
            </Chip>
            <h1>{book.title}</h1>
            <p>{book.description}</p>
            <div className="book-detail-tags">
              {book.tags.map((tag) => (
                <Chip className="book-detail-tag" key={tag} size="sm">
                  #{tag}
                </Chip>
              ))}
            </div>
            <BookProgress label={content.progress} progress={book.progress} />
          </div>
        </div>
      </header>

      <div className="shell book-detail-layout">
        <article>
          <MarkdownContent markdown={book.body} />
        </article>
        <ArticleToc headings={book.headings} title={content.chapters} />
      </div>
    </main>
  );
}
