import { Chip } from "@heroui/react/chip";
import { CalendarDays, Hash } from "lucide-react";

import { PageIntro } from "@/components/page/page-intro";
import { SiteLink } from "@/components/ui/site-link";
import { archiveContent } from "@/features/archives/archive-content";
import { getPostHref } from "@/features/posts/post-links";
import { getTagHref } from "@/features/tags/tag-links";
import {
  getPublishedArticles,
  getTagSummaries,
  groupArticlesByYear,
} from "@/lib/content/queries";
import { getAllArticles } from "@/lib/content/repository";
import type { SiteLocale } from "@/lib/site-config";

interface ArchivePageProps {
  readonly locale: SiteLocale;
}

function formatMonthDay(date: string, locale: SiteLocale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export async function ArchivePage({ locale }: ArchivePageProps) {
  const content = archiveContent[locale];
  const articles = getPublishedArticles(await getAllArticles(), locale);
  const groups = groupArticlesByYear(articles);
  const tags = getTagSummaries(articles);

  return (
    <main className="shell archive-page">
      <PageIntro
        description={content.description}
        index="03"
        title={content.title}
      />

      <div className="archive-layout">
        <aside className="archive-aside">
          <div className="archive-count">
            <CalendarDays aria-hidden="true" />
            <span>{content.count(articles.length)}</span>
          </div>
          <h2>
            <Hash aria-hidden="true" />
            {content.topics}
          </h2>
          <nav aria-label={content.topics} className="archive-tags">
            {tags.map((tag) => (
              <Chip key={tag.name} size="sm" variant="soft">
                <SiteLink href={getTagHref(locale, tag.name)}>
                  <span>{tag.name}</span>
                  <span>{tag.count}</span>
                </SiteLink>
              </Chip>
            ))}
          </nav>
        </aside>

        <div className="archive-timeline">
          {Array.from(groups, ([year, entries]) => (
            <section
              aria-labelledby={`archive-${year}`}
              className="archive-year"
              key={year}
            >
              <header>
                <h2 id={`archive-${year}`}>{year}</h2>
                <span>{content.yearCount(entries.length)}</span>
              </header>
              <div>
                {entries.map((article) => (
                  <article className="archive-row" key={article.slug}>
                    <time dateTime={article.published}>
                      {formatMonthDay(article.published, locale)}
                    </time>
                    <h3>
                      <SiteLink href={getPostHref(locale, article.slug)}>
                        {article.title}
                      </SiteLink>
                    </h3>
                    <span>{article.tags.slice(0, 2).join(" / ")}</span>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
