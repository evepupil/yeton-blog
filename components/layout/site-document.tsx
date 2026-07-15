import type { ReactNode } from "react";

import { AnalyticsScript } from "@/components/integrations/analytics-script";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { ThemeProvider } from "@/features/theme/theme-provider";
import { buildContentLocaleRoutes } from "@/lib/content/locale-routes";
import { getAllArticles, getAllBooks } from "@/lib/content/repository";
import type { SiteLocale } from "@/lib/site-config";

interface SiteDocumentProps {
  readonly children: ReactNode;
  readonly locale: SiteLocale;
}

export async function SiteDocument({ children, locale }: SiteDocumentProps) {
  const [articles, books] = await Promise.all([
    getAllArticles(),
    getAllBooks(),
  ]);
  const contentRoutes = buildContentLocaleRoutes(articles, books);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SkipLink />
          <SiteHeader contentRoutes={contentRoutes} />
          <div className="site-content" id="main-content">
            {children}
          </div>
          <SiteFooter />
        </ThemeProvider>
        <AnalyticsScript />
      </body>
    </html>
  );
}
