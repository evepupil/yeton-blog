import { Card } from "@heroui/react/card";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { SiteLink } from "@/components/ui/site-link";
import { getLocalizedPath } from "@/lib/i18n";
import type { SiteLocale } from "@/lib/site-config";

import { homeContent } from "./home-data";

interface RecentPostsProps {
  readonly locale: SiteLocale;
}

export function RecentPosts({ locale }: RecentPostsProps) {
  const content = homeContent[locale];
  const [primary, ...secondary] = content.featured;

  if (!primary) {
    return null;
  }

  const postsHref = getLocalizedPath("/posts/", locale);

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
        <Card.Root className="featured-primary">
          <div className="featured-media">
            {primary.image ? (
              <Image
                alt=""
                fill
                priority
                sizes="(max-width: 760px) 100vw, 360px"
                src={primary.image}
              />
            ) : null}
          </div>
          <Card.Content className="featured-copy">
            <div>
              <div className="article-meta">
                <span>{primary.topic}</span>
                <time>{primary.date}</time>
                {primary.readTime ? <span>{primary.readTime}</span> : null}
              </div>
              <Card.Title>{primary.title}</Card.Title>
              {primary.description ? (
                <Card.Description>{primary.description}</Card.Description>
              ) : null}
            </div>
            <SiteLink className="article-link" href={postsHref}>
              {content.readPost}
              <ArrowUpRight aria-hidden="true" />
            </SiteLink>
          </Card.Content>
        </Card.Root>

        <div className="featured-secondary">
          {secondary.map((post) => (
            <Card.Root className="featured-small" key={post.title}>
              <Card.Content>
                <div className="article-meta">
                  <span>{post.topic}</span>
                  <time>{post.date}</time>
                </div>
                <Card.Title>{post.title}</Card.Title>
              </Card.Content>
              <Card.Footer>
                <SiteLink className="article-link" href={postsHref}>
                  {content.readPost}
                  <ArrowUpRight aria-hidden="true" />
                </SiteLink>
              </Card.Footer>
            </Card.Root>
          ))}
        </div>
      </div>
    </section>
  );
}
