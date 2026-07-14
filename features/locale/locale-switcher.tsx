"use client";

import { Languages } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { ChangeEvent } from "react";

import { getLocalizedPath } from "@/lib/i18n";
import type { SiteLocale } from "@/lib/site-config";

interface LocaleSwitcherProps {
  readonly label: string;
  readonly locale: SiteLocale;
}

export function LocaleSwitcher({ label, locale }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLocaleChange(event: ChangeEvent<HTMLSelectElement>) {
    router.push(getLocalizedPath(pathname, event.target.value as SiteLocale));
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
