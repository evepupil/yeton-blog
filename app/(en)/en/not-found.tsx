import type { Metadata } from "next";

import { NotFoundPage } from "@/features/not-found/not-found-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

const notFoundMetadata = buildPageMetadata({
  alternatePaths: { en: "/en/404/" },
  description: "There is no page at this address.",
  locale: "en",
  noIndex: true,
  pathname: "/en/404/",
  title: "Page not found",
});
export const metadata: Metadata = {
  ...notFoundMetadata,
  alternates: undefined,
};

export default function EnglishNotFoundPage() {
  return <NotFoundPage locale="en" />;
}
