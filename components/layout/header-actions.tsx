"use client";

import { Button } from "@heroui/react/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { NavigationLinks } from "@/components/layout/navigation-links";
import { LocaleSwitcher } from "@/features/locale/locale-switcher";
import { SearchDialog } from "@/features/search/search-dialog";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { messages } from "@/lib/i18n";
import type { LocaleRouteMap } from "@/lib/i18n";
import type { NavigationItem } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/site-config";

interface HeaderActionsProps {
  readonly contentRoutes: LocaleRouteMap;
  readonly items: readonly NavigationItem[];
  readonly locale: SiteLocale;
  readonly pathname: string;
}

export function HeaderActions({
  contentRoutes,
  items,
  locale,
  pathname,
}: HeaderActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const copy = messages[locale];

  return (
    <div className="header-actions">
      <SearchDialog label={copy.searchLabel} locale={locale} />
      <LocaleSwitcher
        contentRoutes={contentRoutes}
        label={copy.localeLabel}
        locale={locale}
      />
      <ThemeToggle label={copy.themeLabel} />
      <Button
        aria-controls="mobile-navigation"
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? copy.menuClose : copy.menuOpen}
        className="header-icon-button mobile-menu-button"
        isIconOnly
        onPress={() => setIsMenuOpen((current) => !current)}
        size="sm"
        variant="ghost"
      >
        {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </Button>

      <div
        className="mobile-navigation"
        hidden={!isMenuOpen}
        id="mobile-navigation"
      >
        <NavigationLinks
          items={items}
          onNavigate={() => setIsMenuOpen(false)}
          pathname={pathname}
        />
      </div>
    </div>
  );
}
