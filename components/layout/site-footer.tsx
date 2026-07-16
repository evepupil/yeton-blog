"use client";

import { usePathname } from "next/navigation";

import { SiteLink } from "@/components/ui/site-link";
import { resolveUmamiConfig } from "@/lib/analytics/config";
import { getLocaleFromPath, getLocalizedPath, messages } from "@/lib/i18n";
import { getLocalizedSiteConfig, siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const copy = messages[locale];
  const identity = getLocalizedSiteConfig(locale);
  const analytics = resolveUmamiConfig();

  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <strong>{identity.name}</strong>
          <p>{identity.footerLine}</p>
        </div>
        <nav
          aria-label={locale === "en" ? "Footer navigation" : "页脚导航"}
          className="footer-links"
        >
          <SiteLink href={getLocalizedPath("/posts/", locale)}>
            {copy.nav.posts}
          </SiteLink>
          <SiteLink href={getLocalizedPath("/books/", locale)}>
            {copy.nav.books}
          </SiteLink>
          <SiteLink href={getLocalizedPath("/links/", locale)}>
            {copy.nav.links}
          </SiteLink>
          <SiteLink href={getLocalizedPath("/about/", locale)}>
            {copy.nav.about}
          </SiteLink>
          <a href={getLocalizedPath("/rss.xml", locale)}>RSS</a>
          {analytics?.shareUrl ? (
            <a href={analytics.shareUrl} rel="noreferrer" target="_blank">
              {locale === "en" ? "Stats" : "统计"}
            </a>
          ) : null}
        </nav>
        <p className="copyright">
          © {siteConfig.copyrightYear} {siteConfig.brand.wordmark}
        </p>
      </div>
    </footer>
  );
}
