"use client";

import { usePathname } from "next/navigation";

import { getLocaleFromPath } from "@/lib/i18n";

export function SkipLink() {
  const locale = getLocaleFromPath(usePathname());

  return (
    <a className="skip-link" href="#main-content">
      {locale === "en" ? "Skip to content" : "跳到正文"}
    </a>
  );
}
