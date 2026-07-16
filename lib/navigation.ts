import { getLocalizedPath, messages, stripLocalePrefix } from "@/lib/i18n";
import type { SiteLocale } from "@/lib/site-config";

const routeDefinitions = [
  { key: "home", path: "/" },
  { key: "posts", path: "/posts/" },
  { key: "archives", path: "/archives/" },
  { key: "books", path: "/books/" },
  { key: "links", path: "/links/" },
  { key: "about", path: "/about/" },
] as const;

export interface NavigationItem {
  readonly href: string;
  readonly key: (typeof routeDefinitions)[number]["key"];
  readonly label: string;
}

export function getNavigationItems(locale: SiteLocale): NavigationItem[] {
  return routeDefinitions.map(({ key, path }) => ({
    key,
    href: getLocalizedPath(path, locale),
    label: messages[locale].nav[key],
  }));
}

export function isNavigationItemActive(
  pathname: string,
  itemHref: string,
): boolean {
  const currentPath = stripLocalePrefix(pathname);
  const targetPath = stripLocalePrefix(itemHref);

  if (targetPath === "/") {
    return currentPath === "/";
  }

  return currentPath === targetPath || currentPath.startsWith(targetPath);
}
