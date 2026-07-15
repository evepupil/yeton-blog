import type { Metadata } from "next";

import { ArchivePage } from "@/features/archives/archive-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getLocalizedSiteConfig } from "@/lib/site-config";

const identity = getLocalizedSiteConfig("en");

export const metadata: Metadata = buildPageMetadata({
  description: identity.sectionDescriptions.archives,
  locale: "en",
  pathname: "/en/archives/",
  title: "Archive",
});

export default function EnglishArchivesPage() {
  return <ArchivePage locale="en" />;
}
