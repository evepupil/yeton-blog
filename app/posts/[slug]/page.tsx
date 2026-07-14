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

  return getPublishedArticles(articles, "zh-CN").map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArticleRouteProps): Promise<Metadata> {
  const [{ slug }, articles] = await Promise.all([params, getAllArticles()]);
  const article = findPublishedArticle(articles, "zh-CN", slug);

  return article
    ? { description: article.description, title: article.title }
    : { title: "文章未找到" };
}

export default async function ChineseArticlePage({
  params,
}: ArticleRouteProps) {
  const [{ slug }, articles] = await Promise.all([params, getAllArticles()]);
  const article = findPublishedArticle(articles, "zh-CN", slug);

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
