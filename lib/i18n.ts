import type { SiteLocale } from "@/lib/site-config";

export const messages = {
  "zh-CN": {
    nav: {
      home: "首页",
      posts: "文章",
      archives: "归档",
      books: "图书",
      about: "关于",
    },
    localeLabel: "选择语言",
    menuOpen: "打开菜单",
    menuClose: "关闭菜单",
    themeLabel: "切换主题",
    footerLine: "持续写作，保持清醒。",
  },
  en: {
    nav: {
      home: "Home",
      posts: "Writing",
      archives: "Archive",
      books: "Books",
      about: "About",
    },
    localeLabel: "Choose language",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    themeLabel: "Toggle theme",
    footerLine: "Write consistently. Think clearly.",
  },
} as const satisfies Record<SiteLocale, object>;

function withTrailingSlash(pathname: string): string {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export function getLocaleFromPath(pathname: string): SiteLocale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "zh-CN";
}

export function stripLocalePrefix(pathname: string): string {
  const pathOnly = pathname.split(/[?#]/u, 1)[0] || "/";

  if (pathOnly === "/en" || pathOnly === "/en/") {
    return "/";
  }

  if (pathOnly.startsWith("/en/")) {
    return withTrailingSlash(pathOnly.slice(3) || "/");
  }

  return withTrailingSlash(
    pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`,
  );
}

export function getLocalizedPath(pathname: string, locale: SiteLocale): string {
  const basePath = stripLocalePrefix(pathname);

  if (locale === "zh-CN") {
    return basePath;
  }

  return basePath === "/" ? "/en/" : `/en${basePath}`;
}
