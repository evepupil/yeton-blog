import type { MetadataRoute } from "next";

import { getAllArticles, getAllBooks } from "@/lib/content/repository";
import { buildSitemap } from "@/lib/seo/sitemap";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, books] = await Promise.all([
    getAllArticles(),
    getAllBooks(),
  ]);

  return buildSitemap({ articles, books });
}
