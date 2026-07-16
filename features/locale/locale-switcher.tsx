"use client";

import { ListBox } from "@heroui/react/list-box";
import { Select } from "@heroui/react/select";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { Key } from "react";

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

  function handleLocaleChange(key: Key | null) {
    if (key !== "zh-CN" && key !== "en") return;

    router.push(getLocaleSwitchPath(pathname, key, contentRoutes));
  }

  return (
    <Select.Root
      aria-label={label}
      className="locale-switcher"
      onSelectionChange={handleLocaleChange}
      selectedKey={locale}
    >
      <Select.Trigger className="header-icon-button locale-switcher-trigger">
        <Languages aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </Select.Trigger>
      <Select.Popover
        className="locale-switcher-popover"
        placement="bottom end"
      >
        <ListBox className="locale-switcher-list">
          <ListBox.Item
            className="locale-switcher-option"
            id="zh-CN"
            textValue="简体中文"
          >
            <span>简体中文</span>
            <ListBox.ItemIndicator />
          </ListBox.Item>
          <ListBox.Item
            className="locale-switcher-option"
            id="en"
            textValue="English"
          >
            <span>English</span>
            <ListBox.ItemIndicator />
          </ListBox.Item>
        </ListBox>
      </Select.Popover>
    </Select.Root>
  );
}
