import { Chip } from "@heroui/react/chip";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

import { SiteLink } from "@/components/ui/site-link";
import { GiscusComments } from "@/features/comments/giscus-comments";
import { ArticleNavigation } from "@/features/posts/article-navigation";
import { ArticleToc } from "@/features/posts/article-toc";
import { MarkdownContent } from "@/features/posts/markdown-content";
import { formatPostDate } from "@/features/posts/post-links";
import { articleContent } from "@/features/posts/posts-content";
import { getTagHref } from "@/features/tags/tag-links";
import type {
  Article,
  ArticleNavigation as ArticleNavigationData,
} from "@/lib/content/types";
import { readGiscusConfig } from "@/lib/giscus/config";
import { getLocalizedPath } from "@/lib/i18n";

interface ArticlePageProps {
  readonly article: Article;
  readonly navigation: ArticleNavigationData;
}

export function ArticlePage({ article, navigation }: ArticlePageProps) {
  const content = articleContent[article.locale];
  const postsHref = getLocalizedPath("/posts/", article.locale);
  const giscusConfig = readGiscusConfig();

  return (
    <main className="article-page">
      <header className="shell article-header">
        <SiteLink className="article-back-link" href={postsHref}>
          <ArrowLeft aria-hidden="true" />
          {content.back}
        </SiteLink>
        <div className="article-header-meta">
          <time dateTime={article.published}>
            {formatPostDate(article.published, article.locale)}
          </time>
          <span>
            {article.wordCount} {content.words}
          </span>
          <span>
            {article.readTime} {content.minutes}
          </span>
        </div>
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <div className="article-header-tags">
          {article.tags.map((tag) => (
            <Chip key={tag} size="sm" variant="soft">
              <SiteLink href={getTagHref(article.locale, tag)}>{tag}</SiteLink>
            </Chip>
          ))}
        </div>
      </header>

      {article.image ? (
        <div className="shell article-cover">
          <Image
            alt=""
            fill
            priority
            sizes="(max-width: 1228px) calc(100vw - 48px), 1180px"
            src={article.image}
          />
        </div>
      ) : null}

      <div className="shell article-layout">
        <article>
          <MarkdownContent markdown={article.body} />
          <ArticleNavigation
            ariaLabel={content.navigation}
            labels={{ next: content.next, previous: content.previous }}
            navigation={navigation}
          />
          <GiscusComments config={giscusConfig} locale={article.locale} />
        </article>
        <ArticleToc headings={article.headings} title={content.contents} />
      </div>
    </main>
  );
}
