"use client";

import { Languages } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { ChangeEvent } from "react";

import { getLocaleSwitchPath } from "@/lib/i18n";
import type { LocaleRouteMap } from "@/lib/i18n";
import type { SiteLocale } from "@/lib/site-config";

interface LocaleSwitcherProps {
  readonly contentRoutes: LocaleRouteMap;
  readonly label: string;
  readonly locale: SiteLocale;
}

export function LocaleSwitcher({
  contentRoutes,
  label,
  locale,
}: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLocaleChange(event: ChangeEvent<HTMLSelectElement>) {
    router.push(
      getLocaleSwitchPath(
        pathname,
        event.target.value as SiteLocale,
        contentRoutes,
      ),
    );
  }

  return (
    <label className="locale-switcher">
      <Languages aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <select aria-label={label} onChange={handleLocaleChange} value={locale}>
        <option value="zh-CN">中</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}
