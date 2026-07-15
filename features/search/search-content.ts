import type { SiteLocale } from "@/lib/site-config";

export const searchContent = {
  "zh-CN": {
    clear: "清除搜索内容",
    close: "关闭搜索",
    error: "搜索暂时不可用。",
    loading: "正在加载搜索",
    noResults: "没有找到相关内容。",
    placeholder: "搜索标题、标签和正文",
    recent: "最近发布",
    results: (count: number) => `${count} 条结果`,
    retry: "重试",
    title: "搜索文章",
  },
  en: {
    clear: "Clear search query",
    close: "Close search",
    error: "Search is temporarily unavailable.",
    loading: "Loading search",
    noResults: "No matching writing found.",
    placeholder: "Search titles, topics and article text",
    recent: "Recently published",
    results: (count: number) =>
      `${count} ${count === 1 ? "result" : "results"}`,
    retry: "Retry",
    title: "Search writing",
  },
} as const satisfies Record<SiteLocale, object>;
