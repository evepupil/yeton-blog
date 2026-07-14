import type { SiteLocale } from "@/lib/site-config";

export interface FeaturedPostPreview {
  readonly date: string;
  readonly description?: string;
  readonly image?: string;
  readonly readTime?: string;
  readonly title: string;
  readonly topic: string;
}

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
    tags: [
      { name: "前端", count: 2 },
      { name: "部署", count: 1 },
      { name: "产品设计", count: 1 },
      { name: "复盘", count: 1 },
      { name: "工作流", count: 1 },
      { name: "设计系统", count: 1 },
    ],
    featured: [
      {
        topic: "Cloudflare",
        date: "2026年7月10日",
        readTime: "8 MIN",
        title: "把 Next.js 博客稳稳部署到 Cloudflare Pages",
        description:
          "从静态导出、构建命令到缓存策略，记录一次真正可复用的部署过程。",
        image: "/images/article-network.jpg",
      },
      {
        topic: "搜索",
        date: "2026年7月4日",
        title: "个人博客的搜索，应该搜到什么",
      },
      {
        topic: "AI",
        date: "2026年6月26日",
        title: "把 AI 放进写作流程后，我保留了哪些手工步骤",
      },
    ],
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
    tags: [
      { name: "Frontend", count: 2 },
      { name: "Deployment", count: 1 },
      { name: "Product", count: 1 },
      { name: "Review", count: 1 },
      { name: "Workflow", count: 1 },
      { name: "Design", count: 1 },
    ],
    featured: [
      {
        topic: "Cloudflare",
        date: "Jul 9, 2026",
        readTime: "7 MIN",
        title: "Field notes from moving a blog to Cloudflare Pages",
        description:
          "A practical checklist for static output, redirects, assets and runtime boundaries.",
        image: "/images/article-network.jpg",
      },
      {
        topic: "Search",
        date: "Jun 21, 2026",
        title: "Search design for a small personal knowledge base",
      },
      {
        topic: "Writing",
        date: "Jun 12, 2026",
        title: "The manual steps I keep in an AI-assisted workflow",
      },
    ],
  },
} as const satisfies Record<SiteLocale, object>;
