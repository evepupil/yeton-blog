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
  const articles = getPublishedArticles(await getAllArticles(), "en");

  return getTagSummaries(articles).map(({ name }) => ({ tag: name }));
}

export async function generateMetadata({
  params,
}: TagRouteProps): Promise<Metadata> {
  const [{ tag }, articles] = await Promise.all([params, getAllArticles()]);
  const decodedTag = decodeTagSegment(tag);
  const count = getPublishedArticlesByTag(articles, "en", decodedTag).length;

  return {
    description: `${count} ${count === 1 ? "post" : "posts"} tagged ${decodedTag}.`,
    title: `#${decodedTag}`,
  };
}

export default async function EnglishTagPage({ params }: TagRouteProps) {
  const { tag } = await params;

  return <TagPage locale="en" tag={decodeTagSegment(tag)} />;
}
