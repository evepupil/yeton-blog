import { Chip } from "@heroui/react/chip";
import { ArrowUpRight } from "lucide-react";

import { SiteLink } from "@/components/ui/site-link";
import { booksContent } from "@/features/books/book-content";
import { getBookHref } from "@/features/books/book-links";
import { BookProgress } from "@/features/books/book-progress";
import type { Book } from "@/lib/content/types";

interface BookCardProps {
  readonly book: Book;
  readonly index: number;
}

export function BookCard({ book, index }: BookCardProps) {
  const content = booksContent[book.locale];
  const href = getBookHref(book.locale, book.slug);
  const status =
    book.status === "complete" ? content.complete : content.serializing;

  return (
    <article className="book-item">
      <SiteLink aria-label={book.title} className="book-cover" href={href}>
        <span>LINMO BOOK / {String(index + 1).padStart(2, "0")}</span>
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
        <p>{book.description}</p>
        <BookProgress label={content.progress} progress={book.progress} />
        <nav aria-label={content.chapters} className="book-chapters">
          {book.headings.map((chapter) => (
            <SiteLink href={`${href}#${chapter.id}`} key={chapter.id}>
              {chapter.text}
            </SiteLink>
          ))}
        </nav>
        <SiteLink className="article-link" href={href}>
          {content.openBook}
          <ArrowUpRight aria-hidden="true" />
        </SiteLink>
      </div>
    </article>
  );
}
