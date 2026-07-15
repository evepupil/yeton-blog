"use client";

import { usePathname } from "next/navigation";

import { SiteLink } from "@/components/ui/site-link";
import { getLocaleFromPath, getLocalizedPath, messages } from "@/lib/i18n";

export function SiteFooter() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const copy = messages[locale];

  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <strong>{locale === "en" ? "Linmo Notes" : "林墨手记"}</strong>
          <p>{copy.footerLine}</p>
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
          <SiteLink href={getLocalizedPath("/about/", locale)}>
            {copy.nav.about}
          </SiteLink>
          <a href={getLocalizedPath("/rss.xml", locale)}>RSS</a>
        </nav>
        <p className="copyright">© 2026 LINMO NOTES</p>
      </div>
    </footer>
  );
}
