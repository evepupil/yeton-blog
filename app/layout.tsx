import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { ThemeProvider } from "@/features/theme/theme-provider";
import { buildContentLocaleRoutes } from "@/lib/content/locale-routes";
import { getAllArticles, getAllBooks } from "@/lib/content/repository";
import { resolveSiteUrl, siteConfig } from "@/lib/site-config";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#151817" },
  ],
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const [articles, books] = await Promise.all([
    getAllArticles(),
    getAllBooks(),
  ]);
  const contentRoutes = buildContentLocaleRoutes(articles, books);

  return (
    <html lang={siteConfig.defaultLocale} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SkipLink />
          <SiteHeader contentRoutes={contentRoutes} />
          <div className="site-content" id="main-content">
            {children}
          </div>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
