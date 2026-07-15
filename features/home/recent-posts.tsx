import { Card } from "@heroui/react/card";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { SiteLink } from "@/components/ui/site-link";
import { formatPostDate, getPostHref } from "@/features/posts/post-links";
import type { ArticlePreview } from "@/lib/content/types";
import { getLocalizedPath } from "@/lib/i18n";
import type { SiteLocale } from "@/lib/site-config";

import { homeContent } from "./home-data";

interface RecentPostsProps {
  readonly locale: SiteLocale;
  readonly posts: readonly ArticlePreview[];
}

export function RecentPosts({ locale, posts }: RecentPostsProps) {
  const content = homeContent[locale];
  const [primary, ...secondary] = posts;

  if (!primary) {
    return null;
  }

  const postsHref = getLocalizedPath("/posts/", locale);
  const primaryHref = getPostHref(primary.locale, primary.slug);

  return (
    <section aria-labelledby="recent-title" className="shell recent-posts">
      <header className="section-heading">
        <div>
          <span className="section-index">01</span>
          <h2 id="recent-title">{content.recentTitle}</h2>
        </div>
        <SiteLink className="text-link" href={postsHref}>
          {content.viewAll}
          <ArrowRight aria-hidden="true" />
        </SiteLink>
      </header>

      <div className="featured-layout">
        <SiteLink
          aria-label={primary.title}
          className="featured-card-link featured-primary-link"
          href={primaryHref}
        >
          <Card.Root
            className={`featured-primary${primary.image ? " has-media" : ""}`}
          >
            {primary.image ? (
              <div className="featured-media">
                <Image
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 760px) 100vw, 360px"
                  src={primary.image}
                />
              </div>
            ) : null}
            <Card.Content className="featured-copy">
              <div>
                <div className="article-meta">
                  <span>{primary.tags[0]}</span>
                  <time dateTime={primary.published}>
                    {formatPostDate(primary.published, locale)}
                  </time>
                  <span>{primary.readTime} MIN</span>
                </div>
                <Card.Title>{primary.title}</Card.Title>
                {primary.description ? (
                  <Card.Description>{primary.description}</Card.Description>
                ) : null}
              </div>
              <span className="article-link">
                {content.readPost}
                <ArrowUpRight aria-hidden="true" />
              </span>
            </Card.Content>
          </Card.Root>
        </SiteLink>

        <div className="featured-secondary">
          {secondary.map((post, index) => (
            <SiteLink
              aria-label={post.title}
              className="featured-card-link"
              href={getPostHref(post.locale, post.slug)}
              key={post.slug}
            >
              <Card.Root
                className={`featured-small ${index === 0 ? "is-coral" : "is-accent"}`}
              >
                <Card.Content>
                  <div className="article-meta">
                    <span>{post.tags[0]}</span>
                    <time dateTime={post.published}>
                      {formatPostDate(post.published, locale)}
                    </time>
                  </div>
                  <Card.Title>{post.title}</Card.Title>
                </Card.Content>
                <Card.Footer>
                  <span className="article-link">
                    {content.readPost}
                    <ArrowUpRight aria-hidden="true" />
                  </span>
                </Card.Footer>
              </Card.Root>
            </SiteLink>
          ))}
        </div>
      </div>
    </section>
  );
}
