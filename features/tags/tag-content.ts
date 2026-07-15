import type { SiteLocale } from "@/lib/site-config";

export const tagContent = {
  "zh-CN": {
    count: (count: number) => `这个主题下共有 ${count} 篇文章。`,
    readPost: "阅读全文",
  },
  en: {
    count: (count: number) =>
      `${count} ${count === 1 ? "post" : "posts"} in this topic.`,
    readPost: "Read post",
  },
} as const satisfies Record<SiteLocale, object>;
