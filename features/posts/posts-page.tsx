import { PageIntro } from "@/components/page/page-intro";
import { resolveAdPlacement } from "@/lib/monetization/config";
import { ArticleBrowser } from "@/features/posts/article-browser";
import { postsContent } from "@/features/posts/posts-content";
import {
  getPublishedArticlePreviews,
  getPublishedArticles,
  getTagSummaries,
} from "@/lib/content/queries";
import { getAllArticles } from "@/lib/content/repository";
import type { SiteLocale } from "@/lib/site-config";

interface PostsPageProps {
  readonly locale: SiteLocale;
}

export async function PostsPage({ locale }: PostsPageProps) {
  const content = postsContent[locale];
  const articles = await getAllArticles();
  const published = getPublishedArticles(articles, locale);

  return (
    <main className="shell posts-page">
      <PageIntro
        description={content.description}
        index="02"
        title={content.title}
      />
      <ArticleBrowser
        advertisement={resolveAdPlacement("posts", locale)}
        articles={getPublishedArticlePreviews(articles, locale)}
        locale={locale}
        tags={getTagSummaries(published)}
      />
    </main>
  );
}
