import type { Metadata } from "next";

import { ArchivePage } from "@/features/archives/archive-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description: "Browse all published writing by year.",
  locale: "en",
  pathname: "/en/archives/",
  title: "Archive",
});

export default function EnglishArchivesPage() {
  return <ArchivePage locale="en" />;
}
