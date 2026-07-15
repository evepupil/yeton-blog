import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { SiteLink } from "@/components/ui/site-link";
import { formatPostDate, getPostHref } from "@/features/posts/post-links";
import type { ArticlePreview } from "@/lib/content/types";
import type { SiteLocale } from "@/lib/site-config";

interface ArticleCardProps {
  readonly article: ArticlePreview;
  readonly locale: SiteLocale;
  readonly readLabel: string;
}

export function ArticleCard({ article, locale, readLabel }: ArticleCardProps) {
  const href = getPostHref(article.locale, article.slug);

  return (
    <article className="post-card">
      <SiteLink
        aria-label={article.title}
        className="post-card-link"
        href={href}
      >
        <Card.Root
          className={`post-card-frame${article.image ? " has-media" : ""}`}
        >
          {article.image ? (
            <div className="post-card-media">
              <Image
                alt=""
                fill
                sizes="(max-width: 760px) 112px, 180px"
                src={article.image}
              />
            </div>
          ) : null}
          <Card.Content className="post-card-body">
            <div className="article-meta">
              <time dateTime={article.published}>
                {formatPostDate(article.published, locale)}
              </time>
              <span>{article.readTime} MIN</span>
            </div>
            <h2>{article.title}</h2>
            <Card.Description>{article.description}</Card.Description>
            <div
              className="post-card-tags"
              aria-label={article.tags.join(", ")}
            >
              {article.tags.slice(0, 3).map((tag) => (
                <Chip key={tag} size="sm" variant="soft">
                  {tag}
                </Chip>
              ))}
            </div>
            <span className="article-link">
              {readLabel}
              <ArrowUpRight aria-hidden="true" />
            </span>
          </Card.Content>
        </Card.Root>
      </SiteLink>
    </article>
  );
}
