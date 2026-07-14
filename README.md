# HeroUI Blog

使用 Next.js、HeroUI 和 Tailwind CSS 实现的个人博客，构建产物面向 Cloudflare Pages 静态部署。

## 当前进度

- 阶段 0 工程骨架与阶段 1 公共布局已完成
- HTML 原型保留在 `prototype/index.html`
- Next.js 页面正在按 `docs/roadmap.md` 逐步实现

相关文档：

- 原型设计：`docs/prototype-design.md`
- 实现路线图：`docs/roadmap.md`
- 工程基础：`docs/模块设计/工程基础.md`
- 设计系统与公共布局：`docs/模块设计/设计系统与公共布局.md`

## 环境要求

- Node.js 22.14 或更高版本
- pnpm 10.21

## 常用命令

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm preview
```

`pnpm build` 会把静态站点输出到 `out`。`pnpm preview` 使用 Wrangler 预览该目录，日常实现时按需手动执行。

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
