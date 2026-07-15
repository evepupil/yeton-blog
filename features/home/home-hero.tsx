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
import {
  getLocalizedSiteConfig,
  siteConfig,
  type SiteLocale,
} from "@/lib/site-config";

import { homeContent } from "./home-data";

interface HomeHeroProps {
  readonly locale: SiteLocale;
  readonly tags: readonly TagSummary[];
}

const socialIcons = {
  github: GitFork,
  zhihu: MessageCircle,
} as const;

export function HomeHero({ locale, tags }: HomeHeroProps) {
  const content = homeContent[locale];
  const identity = getLocalizedSiteConfig(locale);
  const postsHref = getLocalizedPath("/posts/", locale);

  return (
    <section aria-labelledby="home-title" className="shell home-hero">
      <div className="hero-copy">
        <h1 id="home-title">{identity.homeTitle}</h1>
        <p>{identity.description}</p>
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
              alt={identity.authorAvatarAlt}
              className="profile-avatar"
              height={82}
              priority
              referrerPolicy="no-referrer"
              src={siteConfig.author.avatar.src}
              width={82}
            />
            <div className="profile-copy">
              <Card.Title>{identity.authorName}</Card.Title>
              <Card.Description>{identity.authorBio}</Card.Description>
            </div>
          </Card.Content>
          <Card.Footer className="profile-socials">
            {siteConfig.socialLinks
              .filter((link) => link.enabled)
              .map((link) => {
                const Icon = socialIcons[link.platform];
                return (
                  <a
                    href={link.href}
                    key={link.platform}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Icon aria-hidden="true" /> {link.label[locale]}
                  </a>
                );
              })}
            <a href={getLocalizedPath("/rss.xml", locale)}>
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
