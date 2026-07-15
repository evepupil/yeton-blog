"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { HeaderActions } from "@/components/layout/header-actions";
import { NavigationLinks } from "@/components/layout/navigation-links";
import { SiteLink } from "@/components/ui/site-link";
import { getLocaleFromPath, getLocalizedPath } from "@/lib/i18n";
import type { LocaleRouteMap } from "@/lib/i18n";
import { getNavigationItems } from "@/lib/navigation";

interface SiteHeaderProps {
  readonly contentRoutes: LocaleRouteMap;
}

export function SiteHeader({ contentRoutes }: SiteHeaderProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const items = getNavigationItems(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <header className="site-header">
      <nav
        aria-label={locale === "en" ? "Main navigation" : "主导航"}
        className="nav-shell"
      >
        <SiteLink
          aria-label={locale === "en" ? "Back to home" : "返回首页"}
          className="site-brand"
          href={getLocalizedPath("/", locale)}
        >
          <span aria-hidden="true" className="brand-mark">
            L
          </span>
          <span className="brand-copy">
            <strong>{locale === "en" ? "Linmo Notes" : "林墨手记"}</strong>
            <small>LINMO NOTES</small>
          </span>
        </SiteLink>

        <div className="desktop-navigation">
          <NavigationLinks items={items} pathname={pathname} />
        </div>

        <HeaderActions
          contentRoutes={contentRoutes}
          items={items}
          locale={locale}
          pathname={pathname}
        />
      </nav>
    </header>
  );
}
