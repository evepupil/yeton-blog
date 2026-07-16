import type { SiteLocale } from "@/lib/site-config";

export const booksContent = {
  "zh-CN": {
    author: "作者",
    back: "返回图书列表",
    backToBook: "返回图书目录",
    chapter: "第 {current} 章 / 共 {total} 章",
    chapterCount: "共 {count} 章",
    chapters: "章节目录",
    complete: "已完成",
    description: "把适合系统学习的内容整理成可以逐章阅读的书。",
    introduction: "内容简介",
    nextChapter: "下一章",
    openBook: "查看目录",
    previousChapter: "上一章",
    startReading: "开始阅读",
    serializing: "连载中",
    title: "图书与长文",
    translator: "译者",
    updated: "更新于",
  },
  en: {
    author: "Author",
    back: "Back to books",
    backToBook: "Back to contents",
    chapter: "Chapter {current} of {total}",
    chapterCount: "{count} chapters",
    chapters: "Chapters",
    complete: "Complete",
    description:
      "Structured notes for subjects that deserve chapter-by-chapter reading.",
    introduction: "Introduction",
    nextChapter: "Next chapter",
    openBook: "View contents",
    previousChapter: "Previous chapter",
    startReading: "Start reading",
    serializing: "In progress",
    title: "Books and long reads",
    translator: "Translator",
    updated: "Updated",
  },
} as const satisfies Record<SiteLocale, object>;

export function formatBookContent(
  template: string,
  values: Readonly<Record<string, number>>,
): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template,
  );
}
