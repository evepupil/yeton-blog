import {
  getPublishedArticlePreviews,
  getPublishedArticles,
  getTagSummaries,
} from "@/lib/content/queries";
import { getAllArticles } from "@/lib/content/repository";
import type { SiteLocale } from "@/lib/site-config";

import { HomeHero } from "./home-hero";
import { RecentPosts } from "./recent-posts";

interface HomePageProps {
  readonly locale: SiteLocale;
}

export async function HomePage({ locale }: HomePageProps) {
  const articles = await getAllArticles();
  const published = getPublishedArticles(articles, locale);
  const previews = getPublishedArticlePreviews(articles, locale);

  return (
    <main>
      <HomeHero locale={locale} tags={getTagSummaries(published).slice(0, 6)} />
      <RecentPosts locale={locale} posts={previews.slice(0, 3)} />
    </main>
  );
}
