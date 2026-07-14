import type { SiteLocale } from "@/lib/site-config";

export const homeContent = {
  "zh-CN": {
    title: "写下代码之外，仍值得反复想的事。",
    description: "关于前端、AI 与独立开发，也记录一些慢下来的时刻。",
    readArticles: "阅读文章",
    browseArchives: "浏览归档",
    profileName: "林墨",
    profileBio: "保持好奇，持续交付。",
    topicsTitle: "主题",
    recentTitle: "近期文章",
    viewAll: "查看全部",
    readPost: "阅读全文",
  },
  en: {
    title: "Notes on code, craft, and the questions worth revisiting.",
    description:
      "Frontend, AI and independent building, with room for slower observations.",
    readArticles: "Read writing",
    browseArchives: "Browse archive",
    profileName: "Lin Mo",
    profileBio: "Stay curious. Keep shipping.",
    topicsTitle: "Topics",
    recentTitle: "Recent writing",
    viewAll: "View all",
    readPost: "Read post",
  },
} as const satisfies Record<SiteLocale, object>;
