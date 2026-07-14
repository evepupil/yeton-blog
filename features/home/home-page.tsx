import type { SiteLocale } from "@/lib/site-config";

import { HomeHero } from "./home-hero";
import { RecentPosts } from "./recent-posts";

interface HomePageProps {
  readonly locale: SiteLocale;
}

export function HomePage({ locale }: HomePageProps) {
  return (
    <main>
      <HomeHero locale={locale} />
      <RecentPosts locale={locale} />
    </main>
  );
}
