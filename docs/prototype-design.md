# 个人博客 HTML 原型设计

## 目标

这份原型用于确认个人博客的页面结构、功能入口与交互方式。视觉采用独立设计，功能范围参考 `D:\myproject\my-fuwari`。

## 功能范围

### 原型已覆盖

- 首页作者介绍、热门主题、置顶/近期文章
- 文章列表、标签筛选、文章数量
- 全文搜索，覆盖标题、标签、摘要与正文
- 按年份归档与标签过滤
- 图书列表、阅读进度与章节目录
- 文章详情、阅读时间、字数、文内目录与本地评论演示
- 中文/英文切换、明暗主题与移动端导航
- RSS 入口、友链入口与博客 AI 助手演示

### Next.js 阶段接入

- Markdown/MDX 内容读取与静态页面生成
- SEO、站点地图、Open Graph 与正式 RSS
- Giscus 评论
- Notion 文章/友链同步和图片下载脚本
- Cloudflare Pages Functions 与 AI Search/AutoRAG
- 访问统计、图片回退与部署流水线

## 视觉系统

- 背景：纯白，深色模式使用接近黑色的中性背景
- 主色：青绿色 `#087f6f`
- 辅色：珊瑚红 `#e85d3f`、芥末黄 `#e8b94f`
- 标题：中文衬线字体，正文与控件使用无衬线字体
- 容器：开放式页面结构；卡片只用于文章、弹层和重复条目，圆角不超过 8px
- 图片：本地实景照片，保持统一裁切和稳定宽高

## Next.js + HeroUI 组件映射

| 原型区域 | 建议组件                                            |
| -------- | --------------------------------------------------- |
| 顶部导航 | `SiteHeader`, HeroUI `Navbar`, `Dropdown`, `Button` |
| 首页首屏 | `HomeHero`                                          |
| 文章卡片 | `PostCard`, HeroUI `Card`                           |
| 标签筛选 | `PostFilters`, HeroUI `Tabs`                        |
| 搜索     | `SearchModal`, HeroUI `Modal`, `Input`              |
| 文章详情 | `PostLayout`, `TableOfContents`, `CommentSection`   |
| 图书     | `BookList`, `BookChapters`, HeroUI `Progress`       |
| AI 助手  | `AiChat`, HeroUI `Drawer`, `Textarea`               |

内容查询和排序应放在 `lib/content`，页面只负责组合组件。Cloudflare 相关接口放在独立服务层，方便静态部署与 Pages Functions 分开演进。

## 原型验收视口

- 桌面：`1440 x 1000`
- 移动：`390 x 844`

HTML 原型不需要启动开发服务器，直接打开 `prototype/index.html` 即可。
