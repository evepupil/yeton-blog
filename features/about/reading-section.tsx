import { BookOpen } from "lucide-react";
import Image from "next/image";

import { getReadingStatus } from "@/lib/about-status/reading";
import type { SiteLocale } from "@/lib/site-config";

import { aboutContent } from "./about-content";

interface ReadingSectionProps {
  readonly locale: SiteLocale;
}

function formatReadingMinutes(minutes: number, locale: SiteLocale): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return locale === "en"
    ? `${hours}h ${remainder}m`
    : `${hours} 小时 ${remainder} 分`;
}

export function ReadingSection({ locale }: ReadingSectionProps) {
  const content = aboutContent[locale].reading;
  const status = getReadingStatus();
  const hasSummary =
    status.totalMinutes !== null ||
    status.finishedBooks !== null ||
    status.activeDays !== null;

  return (
    <article
      aria-labelledby="reading-status-title"
      className="about-reading-section"
    >
      <header className="about-section-heading about-section-heading-compact">
        <div>
          <span className="section-index">02</span>
          <h2 id="reading-status-title">{content.heading}</h2>
        </div>
        <p>{content.description}</p>
      </header>

      {hasSummary ? (
        <div aria-label={content.description} className="about-reading-stats">
          <div>
            <strong>
              {status.totalMinutes === null
                ? "—"
                : formatReadingMinutes(status.totalMinutes, locale)}
            </strong>
            <span>{content.totalMinutes}</span>
          </div>
          <div>
            <strong>{status.finishedBooks ?? "—"}</strong>
            <span>{content.finishedBooks}</span>
          </div>
          <div>
            <strong>{status.activeDays ?? "—"}</strong>
            <span>{content.activeDays}</span>
          </div>
        </div>
      ) : null}

      {status.books.length > 0 ? (
        <div className="about-book-shelf">
          {status.books.map((book) => (
            <article
              className="about-book-row"
              key={`${book.title}-${book.author}`}
            >
              {book.cover ? (
                <Image
                  alt=""
                  className="about-book-cover-image"
                  height={112}
                  src={book.cover}
                  width={78}
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="about-book-cover-placeholder"
                >
                  <BookOpen />
                </div>
              )}
              <div>
                <span className="about-book-state">{book.state}</span>
                <h3>{book.title}</h3>
                <p>{book.author}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="about-reading-empty">
          <BookOpen aria-hidden="true" />
          <div>
            <h3>{content.emptyTitle}</h3>
            <p>{content.emptyDescription}</p>
          </div>
        </div>
      )}
    </article>
  );
}
