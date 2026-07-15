import type { Metadata } from "next";

import { TagPage } from "@/features/tags/tag-page";
import { decodeTagSegment, getTagHref } from "@/features/tags/tag-links";
import {
  getPublishedArticles,
  getPublishedArticlesByTag,
  getTagSummaries,
} from "@/lib/content/queries";
import { getAllArticles } from "@/lib/content/repository";
import { buildPageMetadata } from "@/lib/seo/metadata";

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

  const pathname = getTagHref("zh-CN", decodedTag);

  return buildPageMetadata({
    alternatePaths: { "zh-CN": pathname },
    description: `查看“${decodedTag}”主题下的 ${count} 篇文章。`,
    locale: "zh-CN",
    pathname,
    title: `#${decodedTag}`,
  });
}

export default async function ChineseTagPage({ params }: TagRouteProps) {
  const { tag } = await params;

  return <TagPage locale="zh-CN" tag={decodeTagSegment(tag)} />;
}
