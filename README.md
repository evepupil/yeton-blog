# HeroUI Blog

使用 Next.js、HeroUI 和 Tailwind CSS 实现的个人博客，构建产物面向 Cloudflare Pages 静态部署。

## 当前进度

- 阶段 0 至阶段 6 已完成，博客已通过 Cloudflare Pages 的 Git 集成上线
- 阶段 7 已完成 Notion 同步和 Giscus 评论代码，统计与友链页面继续按 roadmap 实现
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
- `integrations`：Giscus、Google AdSense 和 Cloudflare Web Analytics 的公开配置与开关

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

文章页支持点击后加载 Giscus、跟随站点主题和加载失败重试。需要先在 GitHub 为目标仓库开启 Discussions、安装 Giscus App 并选择分类，然后编辑 `site.config.ts` 的 `integrations.comments`：

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

## 内容编写

- 中文文章放在 `content/posts/zh/`，英文文章放在 `content/posts/en/`。
- 中文图书放在 `content/books/zh/`，英文图书放在 `content/books/en/`。
- 文件名使用小写 kebab-case，并作为页面 slug，例如 `cloudflare-pages-nextjs.mdx`。
- 文章必填 `title`、`description`、`published`、`locale` 和 `tags`；图书还需要 `status`、`progress` 和 `order`。
- 有译文时，两种语言使用相同的 `translationKey`；没有译文时省略该字段。
- 本地图片放在 `public/`，frontmatter 使用以 `/` 开头的站内路径。

提交内容前运行 `pnpm content:check`。校验错误会指出具体文件和字段。

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
