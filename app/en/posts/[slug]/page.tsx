import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticlePage } from "@/features/posts/article-page";
import {
  findPublishedArticle,
  getArticleNavigation,
  getPublishedArticles,
} from "@/lib/content/queries";
import { getAllArticles } from "@/lib/content/repository";

export const dynamicParams = false;

interface ArticleRouteProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = await getAllArticles();

  return getPublishedArticles(articles, "en").map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArticleRouteProps): Promise<Metadata> {
  const [{ slug }, articles] = await Promise.all([params, getAllArticles()]);
  const article = findPublishedArticle(articles, "en", slug);

  return article
    ? { description: article.description, title: article.title }
    : { title: "Post not found" };
}

export default async function EnglishArticlePage({
  params,
}: ArticleRouteProps) {
  const [{ slug }, articles] = await Promise.all([params, getAllArticles()]);
  const article = findPublishedArticle(articles, "en", slug);

  if (!article) {
    notFound();
  }

  return (
    <ArticlePage
      article={article}
      navigation={getArticleNavigation(articles, article)}
    />
  );
}
