import { getAllArticles } from "@/lib/content/repository";
import { buildRssFeed } from "@/lib/seo/rss";

export const dynamic = "force-static";

export async function GET() {
  const feed = buildRssFeed(await getAllArticles(), "zh-CN");

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
