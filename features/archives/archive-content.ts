import type { SiteLocale } from "@/lib/site-config";

export const archiveContent = {
  "zh-CN": {
    count: (count: number) => `共 ${count} 篇文章`,
    description: "按时间回看写过的主题与长期关注的问题。",
    title: "文章归档",
    topics: "全部主题",
    yearCount: (count: number) => `${count} 篇`,
  },
  en: {
    count: (count: number) => `${count} ${count === 1 ? "post" : "posts"}`,
    description:
      "A chronological view of recurring topics and unfinished questions.",
    title: "Archive",
    topics: "All topics",
    yearCount: (count: number) => `${count} ${count === 1 ? "post" : "posts"}`,
  },
} as const satisfies Record<SiteLocale, object>;
