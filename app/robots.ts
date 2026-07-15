import type { MetadataRoute } from "next";

import { getAbsoluteUrl } from "@/lib/seo/metadata";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    host: getAbsoluteUrl("/").origin,
    rules: {
      allow: "/",
      disallow: "/search-index/",
      userAgent: "*",
    },
    sitemap: getAbsoluteUrl("/sitemap.xml").toString(),
  };
}
