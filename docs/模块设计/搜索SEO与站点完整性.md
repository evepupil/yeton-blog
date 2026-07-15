# 搜索、SEO 与站点完整性

## 设计

### 职责

本模块负责三件事：把已发布文章生成可在浏览器内检索的轻量索引；为每个静态页面生成正确的公开地址和分享信息；在构建结束后检查 HTML、RSS、站点地图、链接与静态资源是否完整。它不负责在线搜索接口、评论、Notion 同步和生产域名配置。

### 目录结构

| 路径                               | 用途                                        |
| ---------------------------------- | ------------------------------------------- |
| `features/search/`                 | HeroUI 搜索弹窗、文案和样式                 |
| `lib/search/`                      | 分词、索引文档、MiniSearch 配置和浏览器加载 |
| `lib/seo/metadata.ts`              | 页面 canonical、hreflang 和分享元数据       |
| `lib/seo/content-metadata.ts`      | 文章、图书元数据和文章 JSON-LD              |
| `lib/seo/rss.ts`                   | 中英文 RSS 数据与 XML 生成                  |
| `lib/seo/sitemap.ts`               | 静态页面、内容、标签与译文站点地图          |
| `scripts/generate-search-index.ts` | 构建中英文序列化搜索索引                    |
| `scripts/check-static-output.ts`   | 检查最终 `out` 目录                         |
| `public/_redirects`                | 旧站 URL 到当前规范路由的永久跳转           |
| `app/(zh)/rss.xml/route.ts`        | 中文 RSS 静态 Route Handler                 |
| `app/(en)/en/rss.xml/route.ts`     | 英文 RSS 静态 Route Handler                 |
| `app/sitemap.ts`、`app/robots.ts`  | 站点地图和抓取规则                          |

### 关键决策

1. 搜索索引在构建期按语言分别生成。草稿在进入索引前过滤，浏览器不会收到另一种语言的索引。
2. MiniSearch 与索引 JSON 只在首次打开搜索弹窗时并行加载，普通阅读不会下载搜索代码和正文索引。
3. 中文按单个汉字分词，英文按单词分词。查询使用 AND、前缀匹配和长词模糊匹配，减少短查询误命中。
4. 页面元数据统一通过 `lib/seo` 生成。静态栏目自动建立中英文对应关系，文章和图书只在真实译文存在时输出 hreflang。
5. 中文和英文使用两个根布局，构建出的 `<html lang>` 无需等待 hydration。Header 不再在浏览器里补写语言。
6. 文章 JSON-LD 使用 `BlogPosting`，包含作者、发布日期、更新时间、语言、封面和规范地址。序列化时转义 `<`，防止内容结束 script 标签。
7. `pnpm build` 的最后一步解析真实产物。HTML、XML 和 JSON 使用结构化解析器检查，坏链接、缺资源、错误语言或缺少 SEO 字段都会让构建失败。
8. 当前路由继续作为 canonical。旧站路径使用一跳 `301` 合并到对应新页面，不让兼容路径进入 sitemap 或 hreflang。

## 改动历史

### 2026-07-15

- 新增 MiniSearch 构建期索引、HeroUI Modal/SearchField 搜索弹窗和 Header 搜索入口。
- 修复 HeroUI Modal Trigger 内嵌按钮造成的重复可访问控件。
- 将中英文页面迁入独立路由组和根布局，保证静态 HTML 语言正确。
- 为首页、栏目、标签、文章和图书补齐 canonical、hreflang、Open Graph 和 Twitter Card。
- 为文章补充 JSON-LD，并使用文章封面或默认工作区图片作为分享图。
- 生成中英文 RSS、sitemap、robots 和带 `noindex` 的自定义 404；增加显式英文 `/en/404/` 页面。
- 删除图书标签指向不存在文章标签页的死链，图书标签保留为 HeroUI Chip。
- 增加静态产物检查和 SEO 单测，并覆盖搜索、404、关键元数据和无 JavaScript 阅读流程。
- 增加 notion-fuwari 旧文章、归档、标签、关于页、图书章节和 sitemap 的永久重定向，并把规则完整性接入构建检查。

## 实现细节

### 搜索流程

1. `pnpm search:build` 读取全部文章，只保留当前语言的已发布内容。
2. 标题、摘要、标签和正文纯文本写入 MiniSearch，结果只保存标题、摘要、标签、日期与文章路径。
3. 索引序列化到 `public/search-index/{locale}.json`，该目录由构建生成且不提交。
4. 用户首次打开弹窗时，浏览器并行加载 MiniSearch 和当前语言索引。空查询显示最近文章，输入后立即显示匹配数量和结果。
5. 结果使用普通站内链接进入独立文章地址，搜索弹窗关闭后不改变阅读路由规则。

### 元数据与订阅

- `NEXT_PUBLIC_SITE_URL` 是 canonical、分享地址、RSS 和 sitemap 的统一地址来源；本地缺省值为 `http://localhost:3000`。
- 栏目页按相同路由建立中英文 alternates。标签没有跨语言关系，只声明当前语言。
- 文章和图书通过 `translationKey` 找译文，缺少译文时不会输出错误 hreflang。
- RSS 只包含对应语言的已发布文章，按发布时间倒序输出。
- sitemap 包含首页、栏目、文章、图书和文章标签；草稿与 404 不进入站点地图。

### 构建完整性

`pnpm build` 依次执行内容校验、搜索索引、Next 静态导出和 `pnpm site:check`。产物检查会确认：

- 必需的 RSS、sitemap、robots、404 和搜索索引文件存在；
- 每个正常页面具有正确 `lang`、唯一 canonical、当前语言 hreflang、Open Graph 图片和 Twitter Card；
- 文章页包含可解析的 JSON-LD；404 页包含 `noindex`；
- HTML、RSS 和 sitemap 中的站内地址都能映射到 `out` 中的文件或目录；
- 图片、脚本、样式和站内链接没有缺失目标。

### 旧站 URL 迁移

| 旧路径                     | 当前路径            |
| -------------------------- | ------------------- |
| `/posts/en/<slug>/`        | `/en/posts/<slug>/` |
| `/archive/`                | `/archives/`        |
| `/archive/en/`             | `/en/archives/`     |
| `/archive/tag/<tag>/`      | `/tags/<tag>/`      |
| `/archive/en/tag/<tag>/`   | `/en/tags/<tag>/`   |
| `/about/en/`               | `/en/about/`        |
| `/books/<book>/<chapter>/` | `/books/<book>/`    |
| `/sitemap-index.xml`       | `/sitemap.xml`      |

中文文章 `/posts/<slug>/` 与当前规范相同，迁移时保留文件名即可保留 URL。友链和赞助页当前没有等价目标，暂不跳到无关页面；对应功能上线后再补精确规则。

## 测试方法

- Vitest 覆盖分词、语言隔离、标题/标签/正文命中、RSS 草稿过滤、sitemap 译文关系、canonical 和 JSON-LD。
- Playwright 覆盖中英文搜索、搜索结果导航、关键元数据、全局 404、英文 404 和关闭 JavaScript 后的阅读路径。
- `pnpm build` 检查 `_redirects` 存在且包含全部必需迁移规则；部署后冒烟验证关键路径返回单跳 `301` 和正确目标。
- 应用内浏览器检查搜索弹窗、结果状态、文章跳转和控制台错误。

## 当前限制

- 搜索索引随站点构建更新，没有在线增量索引。
- Cloudflare Pages 对未知地址统一使用根目录 `404.html`，所以任意未知 `/en/*` 地址仍会落到中文全局 404；`/en/404/` 已提供英文页面，阶段 6 部署配置再决定是否增加按语言分流。
- 正式 canonical、RSS 和 sitemap 地址取决于阶段 6 配置真实 `NEXT_PUBLIC_SITE_URL`。
