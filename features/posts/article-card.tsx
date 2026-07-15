import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";
import { ArrowUpRight, FileText } from "lucide-react";
import Image from "next/image";

import { SiteLink } from "@/components/ui/site-link";
import { formatPostDate, getPostHref } from "@/features/posts/post-links";
import { getTagHref } from "@/features/tags/tag-links";
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
      <Card.Root className="post-card-frame">
        <div className="post-card-media">
          {article.image ? (
            <Image
              alt=""
              fill
              sizes="(max-width: 760px) 116px, 180px"
              src={article.image}
            />
          ) : (
            <FileText aria-hidden="true" />
          )}
        </div>
        <Card.Content className="post-card-body">
          <div className="article-meta">
            <time dateTime={article.published}>
              {formatPostDate(article.published, locale)}
            </time>
            <span>{article.readTime} MIN</span>
          </div>
          <h2>
            <SiteLink href={href}>{article.title}</SiteLink>
          </h2>
          <Card.Description>{article.description}</Card.Description>
          <div className="post-card-tags" aria-label={article.tags.join(", ")}>
            {article.tags.slice(0, 3).map((tag) => (
              <Chip key={tag} size="sm" variant="soft">
                <SiteLink href={getTagHref(article.locale, tag)}>
                  {tag}
                </SiteLink>
              </Chip>
            ))}
          </div>
          <SiteLink className="article-link" href={href}>
            {readLabel}
            <ArrowUpRight aria-hidden="true" />
          </SiteLink>
        </Card.Content>
      </Card.Root>
    </article>
  );
}
