# HeroUI Blog

使用 Next.js、HeroUI 和 Tailwind CSS 实现的个人博客，构建产物面向 Cloudflare Pages 静态部署。

## 当前进度

- 阶段 0 至阶段 6 已完成，博客已通过 Cloudflare Pages 的 Git 集成上线
- 阶段 7 已完成 Notion 同步、Giscus 评论代码和 Umami 统计，友链页面继续按 roadmap 实现
- 旧站 33 篇真实文章和引用图片已迁入，线上内容目录不再使用演示文章
- HTML 原型保留在 `prototype/index.html`
- Next.js 页面正在按 `docs/roadmap.md` 逐步实现

相关文档：

- 原型设计：`docs/prototype-design.md`
- 实现路线图：`docs/roadmap.md`
- 工程基础：`docs/模块设计/工程基础.md`
- 站点公共配置：`docs/模块设计/站点公共配置.md`
- 设计系统与公共布局：`docs/模块设计/设计系统与公共布局.md`
- 内容系统：`docs/模块设计/内容系统.md`
- 文章阅读流程：`docs/模块设计/文章阅读流程.md`
- 归档、图书与多语言：`docs/模块设计/归档图书与多语言.md`
- 搜索、SEO 与站点完整性：`docs/模块设计/搜索SEO与站点完整性.md`
- Cloudflare Pages 部署：`docs/模块设计/Cloudflare部署.md`
- Notion 同步：`docs/模块设计/Notion同步.md`
- 评论系统：`docs/模块设计/评论系统.md`
- 访问统计：`docs/模块设计/访问统计.md`

## 环境要求

- Node.js 22.14 或更高版本
- pnpm 10.21

## 常用命令

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm content:check
pnpm sync-notion
pnpm sync-friends
pnpm search:build
pnpm site:check
pnpm build
pnpm preview
pnpm smoke:deployment -- https://your-production-origin.example
```

`pnpm content:check` 校验全部文章和图书。`pnpm search:build` 生成双语搜索索引。`pnpm site:check` 检查已有 `out` 产物。`pnpm build` 会依次完成内容校验、搜索索引、静态导出和站点完整性检查。`pnpm preview` 使用 Wrangler 预览 `out`，日常实现时按需手动执行。

## 站点配置

更换博客所有者或第三方服务时，统一编辑根目录的 `site.config.ts`：

- `brand`：中英文博客名称、品牌缩写、字标、图书标识、简介、页脚短句和默认分享图
- `author`：中英文作者名、签名、首页标题、关于页文案、头像来源和替代文字；`avatar.src` 可填写 `/images/...` 或公开 HTTPS URL
- `sectionDescriptions`：文章、归档和图书栏目的中英文介绍
- `socialLinks`：社交平台名称、链接和开关
- `integrations`：Giscus、广告、微信赞赏、Umami 和 AI 搜索的公开配置与开关

这个文件会进入构建产物，只能填写公开值。Notion Token 等私密信息继续放在环境变量中；`NEXT_PUBLIC_SITE_URL` 由部署环境提供，用于区分本地、预览和生产域名。

## Notion 同步

在 `.env.local` 配置 `NOTION_TOKEN`、`NOTION_DATABASE_ID` 和可选的 `NOTION_FRIEND_LINK_DATABASE_ID`。文章数据库沿用参考项目的 `Title`、`Status`、`Published Date`、`Featured Image`、`Tags` 字段，并额外支持 `Slug`、`Description`、`Locale`、`Translation Key`。

```bash
pnpm sync-notion
pnpm sync-notion:new
pnpm sync-notion:append
pnpm sync-friends
pnpm sync-content
```

默认模式会更新 Notion 管理的文章并清理已经不在发布列表中的同步文章。`new` 只添加新文章，`append` 添加并更新且不清理。手写文章发生 slug 冲突时同步会失败，原文件不会被覆盖。GitHub 的 `Sync Notion content` Action 每天北京时间 0 点运行，有变化时提交到 `main`，随后由 Cloudflare Pages 自动部署。

## Giscus 评论

文章页已启用 Giscus，使用 `evepupil/yeton-blog` 的 `General` 分类。评论区接近视口后自动加载，支持跟随站点主题和加载失败重试。更换仓库或分类时，先在 GitHub 开启 Discussions、安装 Giscus App 并选择分类，然后编辑 `site.config.ts` 的 `integrations.comments`：

```ts
comments: {
  enabled: true,
  provider: "giscus",
  repo: "owner/repository",
  repoId: "R_...",
  category: "General",
  categoryId: "DIC_...",
}
```

`enabled` 为 `false` 时评论区显示未开放状态；开启后配置不完整会让构建失败，避免发布一个无法工作的评论入口。

## 广告与赞赏

`site.config.ts` 的 `integrations.advertising` 管理首页、文章列表和正文三个广告位。每个位置可以独立关闭，或选择 `adsense` 和 `custom`。自营广告只读取标题、说明、HTTPS/站内链接和可选的 `/images/` 本地图片，不执行广告 HTML。

`integrations.sponsorship` 管理文章末尾的微信赞赏入口。将真实收款码放到 `public/images/`，再把 `qrCodeSrc` 改成对应的 `/images/...` 路径即可开放扫码；路径为空时弹窗显示未开放状态。

## 内容编写

- 中文文章放在 `content/posts/zh/`，英文文章放在 `content/posts/en/`。
- 中文图书放在 `content/books/zh/`，英文图书放在 `content/books/en/`。
- 文件名使用小写 kebab-case，并作为页面 slug；可以包含中文等 Unicode 字母，例如 `cloudflare-配置教程.mdx`。
- 文章必填 `title`、`description`、`published`、`locale` 和 `tags`；图书还需要 `status`、`progress` 和 `order`，并可填写 `author`、`translator`、`published`、`updated`。
- 有译文时，两种语言使用相同的 `translationKey`；没有译文时省略该字段。
- 本地图片放在 `public/`，frontmatter 使用以 `/` 开头的站内路径。

提交内容前运行 `pnpm content:check`。校验错误会指出具体文件和字段。

## 旧站迁移

`public/_redirects` 将 notion-fuwari 的旧英文文章、归档、标签、英文关于页、图书章节和 sitemap 地址永久跳转到当前规范路由。迁移旧文章时保留原文件名，中文 `/posts/<slug>/` 可以继续使用原地址；英文 `/posts/en/<slug>/` 会 `301` 到 `/en/posts/<slug>/`。

当前仓库已经完成一次真实迁移。需要从旧仓库重新生成时执行：

```bash
pnpm content:migrate-legacy -- --source D:\myproject\notion-fuwari --replace
pnpm content:migrate-legacy-books -- --source D:\myproject\notion-fuwari --replace
pnpm content:check
```

旧 Markdown 不能原样覆盖后直接构建，需要先完成这些机械转换：

- 将 frontmatter 的 `lang` 改为 `locale`
- 删除当前 schema 没有声明的 `category` 等字段
- 将 `published`、`updated` 统一写成引号包裹的 `YYYY-MM-DD`，空的 `image` 字段直接删除
- 把图片迁入 `public/`，并将 Markdown 和 `image` 改为以 `/` 开头的站内路径
- 需要继续由 Notion 管理时，补齐 `source: "notion"` 和对应的 `notionPageId`

图书迁移命令会把旧站每个图书目录的 `index.md` 和编号章节合并为一个 Markdown 文件，将旧章节链接改为单页锚点，并删除当前演示图书。三个旧目录的 slug 和展示顺序在迁移脚本中显式配置，新增目录时需要先补充这两项。

继续使用 Notion 自动同步时，需要先把每篇页面的 `Slug` 属性填写为旧文件名。同步器会保留中文等 Unicode 字符；缺少显式 Slug 时会根据标题和页面 ID 生成新地址。

## 访问统计

站点复用旧博客的 Umami Cloud Website ID，保留历史访问数据。统计脚本在页面加载完成后的空闲阶段请求，不使用 Cookie；脚本被广告拦截器阻止时不会影响阅读。服务地址、Website ID、公开分享 ID 和开关都在 `site.config.ts` 的 `integrations.analytics` 中配置。

正式切换时，把 `blog.chaosyn.com` 关联到当前 Pages 项目，并将 `NEXT_PUBLIC_SITE_URL` 和 Pages 构建命令同步改回该域名。临时域名 `blog1.chaosyn.com` 到正式域名的跳转应通过 Cloudflare Redirect Rule 按 hostname 配置，避免 `_redirects` 在正式域名上形成循环。

## 项目门禁

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
git diff --check
```

- `pnpm test` 同时运行 Vitest 单元测试和原型核心逻辑测试。
- `pnpm test:e2e` 会构建静态站点，并启动一个随测试结束自动关闭的临时文件服务器。
- 本地 E2E 使用已安装的 Chrome，CI 使用 Playwright Chromium。

## Cloudflare Pages

- 构建命令：`NEXT_PUBLIC_SITE_URL=https://blog1.chaosyn.com pnpm build`
- 输出目录：`out`
- Wrangler 配置：`wrangler.jsonc`
- Node.js：`22.14.0`
- pnpm：`10.21.0`
- Cloudflare Pages 环境变量：`NEXT_PUBLIC_SITE_URL`

Pull Request 和 `main` 由 GitHub Actions 执行完整质量检查。Cloudflare Pages 关联 Git 仓库后监听 `main`，仓库更新时自动执行上面的构建命令并发布 `out`。GitHub Action 不调用 Cloudflare 上传接口。首次配置和回滚步骤见 `docs/模块设计/Cloudflare部署.md`。
