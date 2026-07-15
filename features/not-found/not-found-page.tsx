import { PageIntro } from "@/components/page/page-intro";
import { SiteLink } from "@/components/ui/site-link";
import { getLocalizedPath } from "@/lib/i18n";
import type { SiteLocale } from "@/lib/site-config";

interface NotFoundPageProps {
  readonly locale: SiteLocale;
}

const content = {
  "zh-CN": {
    action: "返回首页",
    description: "这个地址没有对应的页面。",
    title: "这里还没有内容。",
  },
  en: {
    action: "Back to home",
    description: "There is no page at this address.",
    title: "This page is missing.",
  },
} as const satisfies Record<SiteLocale, object>;

export function NotFoundPage({ locale }: NotFoundPageProps) {
  const copy = content[locale];

  return (
    <main className="shell static-page">
      <PageIntro
        description={copy.description}
        index="404"
        title={copy.title}
      />
      <SiteLink className="text-link" href={getLocalizedPath("/", locale)}>
        {copy.action}
      </SiteLink>
    </main>
  );
}
