import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { ArticlePage } from "@/features/posts/article-page";
import {
  findPublishedArticle,
  findArticleTranslation,
  getArticleNavigation,
  getPublishedArticles,
} from "@/lib/content/queries";
import { getAllArticles } from "@/lib/content/repository";
import {
  buildArticleMetadata,
  buildArticleStructuredData,
} from "@/lib/seo/content-metadata";
import { buildPageMetadata } from "@/lib/seo/metadata";

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
    ? buildArticleMetadata(
        article,
        findArticleTranslation(articles, article, "en"),
      )
    : buildPageMetadata({
        alternatePaths: { "zh-CN": `/posts/${slug}/` },
        description: "这个地址没有对应的文章。",
        locale: "zh-CN",
        noIndex: true,
        pathname: `/posts/${slug}/`,
        title: "文章未找到",
      });
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
    <>
      <JsonLd data={buildArticleStructuredData(article)} />
      <ArticlePage
        article={article}
        navigation={getArticleNavigation(articles, article)}
      />
    </>
  );
}
