import {
  BookOpen,
  GitFork,
  MessageCircle,
  Radar,
  Rss,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

import { getLocalizedPath } from "@/lib/i18n";
import {
  getLocalizedSiteConfig,
  siteConfig,
  type SiteLocale,
} from "@/lib/site-config";

import { AboutActivity } from "./about-activity";
import { aboutContent } from "./about-content";
import { ReadingSection } from "./reading-section";
import { TechnologyRadar } from "./tech-radar";

interface AboutPageViewProps {
  readonly locale: SiteLocale;
}

const socialIcons = {
  github: GitFork,
  zhihu: MessageCircle,
} as const;

const sourceIcons = [GitFork, Sparkles, BookOpen, Radar] as const;

export function AboutPageView({ locale }: AboutPageViewProps) {
  const identity = getLocalizedSiteConfig(locale);
  const content = aboutContent[locale];

  return (
    <main className="about-page">
      <section
        aria-labelledby="about-page-title"
        className="about-page-hero shell"
      >
        <div className="about-page-intro">
          <div className="about-page-meta">
            <span className="section-index">05</span>
            <span>{content.heroMeta}</span>
          </div>
          <h1 id="about-page-title">{identity.aboutTitle}</h1>
          <p>{identity.about}</p>
        </div>

        <aside aria-label={content.profileLabel} className="about-identity">
          <Image
            alt={identity.authorAvatarAlt}
            className="about-avatar"
            height={112}
            priority
            referrerPolicy="no-referrer"
            src={siteConfig.author.avatar.src}
            width={112}
          />
          <div className="about-identity-copy">
            <div>
              <h2>{identity.authorName}</h2>
              <p>{identity.authorBio}</p>
            </div>
            <nav
              aria-label={locale === "en" ? "Social profiles" : "社交媒体"}
              className="about-social-links"
            >
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
                      <Icon aria-hidden="true" />
                      {link.label[locale]}
                    </a>
                  );
                })}
              <a href={getLocalizedPath("/rss.xml", locale)}>
                <Rss aria-hidden="true" />
                RSS
              </a>
            </nav>
          </div>
        </aside>
      </section>

      <AboutActivity locale={locale} />

      <section
        aria-label={locale === "en" ? "Reading and technology" : "阅读与技术栈"}
        className="about-profile-data shell"
      >
        <ReadingSection locale={locale} />
        <TechnologyRadar locale={locale} />
      </section>

      <section
        aria-labelledby="about-data-title"
        className="about-data-section shell"
      >
        <header className="about-section-heading">
          <div>
            <span className="section-index">04</span>
            <h2 id="about-data-title">{content.data.heading}</h2>
          </div>
          <p>{content.data.description}</p>
        </header>
        <div className="about-source-list">
          {content.data.sources.map(([name, source, cadence], index) => {
            const Icon = sourceIcons[index]!;
            return (
              <div key={name}>
                <Icon aria-hidden="true" />
                <strong>{name}</strong>
                <span>{source}</span>
                <small>{cadence}</small>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
