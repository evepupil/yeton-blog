import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteDocument } from "@/components/layout/site-document";
import { buildRootMetadata, siteViewport } from "@/lib/seo/metadata";

import "../globals.css";

export const metadata: Metadata = buildRootMetadata("en");
export const viewport = siteViewport;

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function EnglishRootLayout({ children }: RootLayoutProps) {
  return <SiteDocument locale="en">{children}</SiteDocument>;
}
