import { notFound } from "next/navigation";

import { PageIntro } from "@/components/page/page-intro";
import { ArticleCard } from "@/features/posts/article-card";
import { tagContent } from "@/features/tags/tag-content";
import {
  getPublishedArticlePreviews,
  getPublishedArticlesByTag,
} from "@/lib/content/queries";
import { getAllArticles } from "@/lib/content/repository";
import type { SiteLocale } from "@/lib/site-config";

interface TagPageProps {
  readonly locale: SiteLocale;
  readonly tag: string;
}

export async function TagPage({ locale, tag }: TagPageProps) {
  const content = tagContent[locale];
  const articles = await getAllArticles();
  const taggedArticles = getPublishedArticlesByTag(articles, locale, tag);

  if (taggedArticles.length === 0) {
    notFound();
  }

  const taggedSlugs = new Set(taggedArticles.map((article) => article.slug));
  const previews = getPublishedArticlePreviews(articles, locale).filter(
    (article) => taggedSlugs.has(article.slug),
  );

  return (
    <main className="shell tag-page">
      <PageIntro
        description={content.count(previews.length)}
        index="02"
        title={`#${tag}`}
      />
      <div className="post-grid tag-post-grid">
        {previews.map((article) => (
          <ArticleCard
            article={article}
            key={article.slug}
            locale={locale}
            readLabel={content.readPost}
          />
        ))}
      </div>
    </main>
  );
}
