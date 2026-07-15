import type { Metadata } from "next";

import { TagPage } from "@/features/tags/tag-page";
import { decodeTagSegment } from "@/features/tags/tag-links";
import {
  getPublishedArticles,
  getPublishedArticlesByTag,
  getTagSummaries,
} from "@/lib/content/queries";
import { getAllArticles } from "@/lib/content/repository";

export const dynamicParams = false;

interface TagRouteProps {
  readonly params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  const articles = getPublishedArticles(await getAllArticles(), "zh-CN");

  return getTagSummaries(articles).map(({ name }) => ({ tag: name }));
}

export async function generateMetadata({
  params,
}: TagRouteProps): Promise<Metadata> {
  const [{ tag }, articles] = await Promise.all([params, getAllArticles()]);
  const decodedTag = decodeTagSegment(tag);
  const count = getPublishedArticlesByTag(articles, "zh-CN", decodedTag).length;

  return {
    description: `查看“${decodedTag}”主题下的 ${count} 篇文章。`,
    title: `#${decodedTag}`,
  };
}

export default async function ChineseTagPage({ params }: TagRouteProps) {
  const { tag } = await params;

  return <TagPage locale="zh-CN" tag={decodeTagSegment(tag)} />;
}
