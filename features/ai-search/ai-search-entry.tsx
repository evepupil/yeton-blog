"use client";

import { Button } from "@heroui/react/button";
import { Tooltip } from "@heroui/react/tooltip";
import { Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

import { aiSearchContent } from "@/features/ai-search/ai-search-content";
import type { SiteLocale } from "@/lib/site-config";

const AiSearchDrawer = dynamic(() =>
  import("@/features/ai-search/ai-search-drawer").then(
    (module) => module.AiSearchDrawer,
  ),
);

interface AiSearchEntryProps {
  readonly endpoint: string;
  readonly locale: SiteLocale;
  readonly maxQueryLength: number;
}

export function AiSearchEntry({
  endpoint,
  locale,
  maxQueryLength,
}: AiSearchEntryProps) {
  const [hasOpened, setHasOpened] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const copy = aiSearchContent[locale];

  function openDrawer() {
    setHasOpened(true);
    setIsOpen(true);
  }

  return (
    <>
      <Tooltip.Root delay={350}>
        <Button
          aria-expanded={isOpen}
          aria-label={copy.launcher}
          className="ai-search-launcher"
          isIconOnly
          onPress={openDrawer}
          size="lg"
        >
          <Sparkles aria-hidden="true" />
        </Button>
        <Tooltip.Content placement="left">{copy.title}</Tooltip.Content>
      </Tooltip.Root>

      {hasOpened ? (
        <AiSearchDrawer
          endpoint={endpoint}
          isOpen={isOpen}
          locale={locale}
          maxQueryLength={maxQueryLength}
          onOpenChange={setIsOpen}
        />
      ) : null}
    </>
  );
}
