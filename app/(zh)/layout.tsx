import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteDocument } from "@/components/layout/site-document";
import { buildRootMetadata, siteViewport } from "@/lib/seo/metadata";

import "../globals.css";

export const metadata: Metadata = buildRootMetadata("zh-CN");
export const viewport = siteViewport;

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  return <SiteDocument locale="zh-CN">{children}</SiteDocument>;
}
