# HeroUI Blog

使用 Next.js、HeroUI 和 Tailwind CSS 实现的个人博客，构建产物面向 Cloudflare Pages 静态部署。

## 当前进度

- 阶段 0 工程骨架、阶段 1 公共布局、阶段 2 内容管线、阶段 3 核心阅读流程和阶段 4 归档图书与多语言已完成
- HTML 原型保留在 `prototype/index.html`
- Next.js 页面正在按 `docs/roadmap.md` 逐步实现

相关文档：

- 原型设计：`docs/prototype-design.md`
- 实现路线图：`docs/roadmap.md`
- 工程基础：`docs/模块设计/工程基础.md`
- 设计系统与公共布局：`docs/模块设计/设计系统与公共布局.md`
- 内容系统：`docs/模块设计/内容系统.md`
- 文章阅读流程：`docs/模块设计/文章阅读流程.md`
- 归档、图书与多语言：`docs/模块设计/归档图书与多语言.md`

## 环境要求

- Node.js 22.14 或更高版本
- pnpm 10.21

## 常用命令

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm content:check
pnpm build
pnpm preview
```

`pnpm content:check` 校验全部文章和图书。`pnpm build` 会先执行内容校验，再把静态站点输出到 `out`。`pnpm preview` 使用 Wrangler 预览该目录，日常实现时按需手动执行。

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

- 构建命令：`pnpm build`
- 输出目录：`out`
- Wrangler 配置：`wrangler.jsonc`
- 正式部署前在 Cloudflare Pages 配置 `NEXT_PUBLIC_SITE_URL` 为站点域名

`main` 分支和 Pull Request 会通过 GitHub Actions 执行完整质量检查。生产发布与回滚流程将在路线图阶段 6 接入。
