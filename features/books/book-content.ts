import type { SiteLocale } from "@/lib/site-config";

export const booksContent = {
  "zh-CN": {
    back: "返回图书列表",
    chapters: "章节目录",
    complete: "已完成",
    description: "把适合系统学习的内容整理成可以逐章阅读的书。",
    openBook: "开始阅读",
    progress: "阅读进度",
    serializing: "连载中",
    title: "图书与长文",
  },
  en: {
    back: "Back to books",
    chapters: "Chapters",
    complete: "Complete",
    description:
      "Structured notes for subjects that deserve chapter-by-chapter reading.",
    openBook: "Start reading",
    progress: "Reading progress",
    serializing: "In progress",
    title: "Books and long reads",
  },
} as const satisfies Record<SiteLocale, object>;
