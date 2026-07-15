import { Card } from "@heroui/react/card";
import {
  ArrowRight,
  ArrowUpRight,
  GitFork,
  MessageCircle,
  Rss,
  Tags,
} from "lucide-react";
import Image from "next/image";

import { SiteLink } from "@/components/ui/site-link";
import { getTagHref } from "@/features/tags/tag-links";
import { getLocalizedPath } from "@/lib/i18n";
import type { TagSummary } from "@/lib/content/types";
import type { SiteLocale } from "@/lib/site-config";

import { homeContent } from "./home-data";

interface HomeHeroProps {
  readonly locale: SiteLocale;
  readonly tags: readonly TagSummary[];
}

export function HomeHero({ locale, tags }: HomeHeroProps) {
  const content = homeContent[locale];
  const postsHref = getLocalizedPath("/posts/", locale);

  return (
    <section aria-labelledby="home-title" className="shell home-hero">
      <div className="hero-copy">
        <h1 id="home-title">{content.title}</h1>
        <p>{content.description}</p>
        <div className="hero-actions">
          <SiteLink className="primary-link" href={postsHref}>
            {content.readArticles}
            <ArrowUpRight aria-hidden="true" />
          </SiteLink>
          <SiteLink
            className="text-link"
            href={getLocalizedPath("/archives/", locale)}
          >
            {content.browseArchives}
            <ArrowRight aria-hidden="true" />
          </SiteLink>
        </div>
      </div>

      <aside
        aria-label={locale === "en" ? "Author and topics" : "作者与文章主题"}
        className="hero-side"
      >
        <Card.Root className="profile-card">
          <Card.Content className="profile-card-content">
            <Image
              alt={locale === "en" ? "Lin Mo avatar" : "林墨的头像"}
              className="profile-avatar"
              height={82}
              priority
              src="/images/profile-avatar.jpg"
              width={82}
            />
            <div className="profile-copy">
              <Card.Title>{content.profileName}</Card.Title>
              <Card.Description>{content.profileBio}</Card.Description>
            </div>
          </Card.Content>
          <Card.Footer className="profile-socials">
            <a href="https://github.com/" rel="noreferrer" target="_blank">
              <GitFork aria-hidden="true" /> GitHub
            </a>
            <a href="https://www.zhihu.com/" rel="noreferrer" target="_blank">
              <MessageCircle aria-hidden="true" />{" "}
              {locale === "en" ? "Zhihu" : "知乎"}
            </a>
            <a href="/rss.xml">
              <Rss aria-hidden="true" /> RSS
            </a>
          </Card.Footer>
        </Card.Root>

        <Card.Root className="topics-card">
          <Card.Header className="topics-heading">
            <Tags aria-hidden="true" />
            <Card.Title>{content.topicsTitle}</Card.Title>
          </Card.Header>
          <Card.Content className="topic-list">
            {tags.map((tag) => (
              <SiteLink href={getTagHref(locale, tag.name)} key={tag.name}>
                <span>#{tag.name}</span>
                <span>{tag.count}</span>
              </SiteLink>
            ))}
          </Card.Content>
        </Card.Root>
      </aside>
    </section>
  );
}
