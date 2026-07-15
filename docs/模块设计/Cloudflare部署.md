# Cloudflare Pages 部署

## 设计

### 职责

本模块负责约定 Cloudflare Pages 从关联 Git 仓库构建本站时使用的运行版本、构建命令、输出目录、公开站点地址、缓存和安全响应头。GitHub Actions 只检查代码质量以及后续同步 Notion 内容，不调用 Wrangler 上传站点。

### 目录结构

| 路径                                   | 用途                                 |
| -------------------------------------- | ------------------------------------ |
| `.github/workflows/quality.yml`        | PR 与 `main` 的代码质量检查          |
| `.node-version`、`.nvmrc`              | 锁定 Node.js 22.14.0                 |
| `wrangler.jsonc`                       | Pages 输出目录与本地预览配置         |
| `public/_headers`                      | 静态资源缓存和生产安全响应头         |
| `lib/deployment/config.ts`             | Pages 构建时的公开站点 URL 校验      |
| `scripts/validate-cloudflare-build.ts` | 区分本地构建和 Cloudflare Pages 构建 |
| `scripts/smoke-deployment.ts`          | 部署后手动执行的公网 HTTP 冒烟       |
| `tests/unit/deployment-config.test.ts` | 构建环境纯函数单测                   |

### 关键决策

1. Cloudflare Pages 关联 Git 仓库并监听目标分支。仓库更新后由 Cloudflare 拉取代码、执行 `pnpm build` 并发布 `out`。
2. GitHub Action 不保存 Cloudflare API Token、Account ID 或 Pages 项目名，也不执行 `wrangler pages deploy`。
3. Notion 同步沿用参考项目 `D:\myproject\my-fuwari` 的职责边界：Action 同步内容并推送 commit，Cloudflare 看到仓库更新后自动部署。
4. `NEXT_PUBLIC_SITE_URL` 是 Pages 中唯一必需的本站构建变量，用于 canonical、RSS、sitemap 和分享地址。Cloudflare 自动注入 `CF_PAGES=1` 时，缺少或误用示例地址会让构建失败。
5. Node.js 固定为 `22.14.0`，pnpm 固定为 `10.21.0`。Cloudflare 构建命令和本地门禁使用同一份 lockfile。
6. `public/_headers` 为 HTML 设置立即校验缓存，为带内容哈希的 Next 静态资源设置一年 immutable 缓存；图片、搜索索引和订阅文件使用较短缓存。
7. CSP 只允许站内脚本、样式、字体、图片和请求。Next 和主题初始化需要内联脚本与样式，因此当前保留 `unsafe-inline`；接入评论或统计时必须同步调整来源。

## 改动历史

### 2026-07-15

- 锁定 Node.js 与 pnpm 版本，收紧 `package.json` Node 引擎范围。
- 增加 Cloudflare Pages 构建环境识别和真实 `NEXT_PUBLIC_SITE_URL` 校验。
- 保留 GitHub `Quality` 工作流，不增加重复的 Wrangler 上传 job。
- 增加 CSP、HSTS、权限策略、防嵌入、防 MIME 猜测和分层缓存规则。
- 增加首页、英文首页、文章、RSS、sitemap、robots、搜索索引和 404 的公网冒烟脚本。
- 将 `_headers` 纳入静态产物完整性检查，并为 Pages 构建配置增加单测。
- 根据参考项目确认部署模型后，删除主动上传所需的 Cloudflare secrets、variables 和部署脚本。
- 将 Git remote 关联到 `evepupil/yeton-blog`，确认 Cloudflare Pages 项目 `yeton-blog` 已连接该仓库。
- 使用正式地址 `https://blog1.chaosyn.com` 完成生产构建、Wrangler 首次发布和公网冒烟。

## 实现细节

### Pages 项目设置

在 Cloudflare Dashboard 创建 Pages 项目并关联 Git 仓库，配置：

| 配置项               | 值                          |
| -------------------- | --------------------------- |
| Pages project        | `yeton-blog`                |
| Production branch    | `main`                      |
| Production origin    | `https://blog1.chaosyn.com` |
| Build command        | `pnpm build`                |
| Build output         | `out`                       |
| Root directory       | `/`                         |
| Node.js              | `22.14.0`                   |
| pnpm                 | `10.21.0`                   |
| Environment variable | `NEXT_PUBLIC_SITE_URL`      |

`NEXT_PUBLIC_SITE_URL` 当前填写 `https://blog1.chaosyn.com`。没有自定义域名时可先使用该项目的正式 `pages.dev` 地址。它不能使用 localhost、`example.com`、子路径、查询参数或 hash。

### 自动部署流程

1. Pull Request 通过 GitHub `Quality` 检查。
2. 合并到 `main` 后，Cloudflare Pages 的 Git 集成检测到新 commit。
3. Cloudflare 安装锁定依赖并运行 `pnpm build`。
4. 构建脚本检测到 `CF_PAGES=1`，校验 `NEXT_PUBLIC_SITE_URL`，随后生成并检查 `out`。
5. Cloudflare 发布静态产物并保留 deployment 历史。

为了让质量门禁真正阻止坏版本进入生产分支，需要在 GitHub 为 `main` 开启分支保护，并把 `Quality / quality` 设为合并前必需检查。

### Notion 同步关系

未来的定时同步 Action 只执行：

1. 从 Notion 生成仓库内容和本地图片。
2. 有变化时由 `github-actions[bot]` 提交并推送。
3. Cloudflare Pages 通过 Git 集成自动构建这个新 commit。

同步 Action 不调用 Cloudflare API，也不保存 Cloudflare 部署凭据。

### 冒烟范围

部署完成后可在本机执行：

```bash
pnpm smoke:deployment -- https://your-production-origin.example
```

脚本检查中英文首页、真实文章、RSS、sitemap、robots、搜索索引、404 和安全响应头。Cloudflare Dashboard 的部署状态仍是发布结果的主要来源。

### 回滚

1. 在 Cloudflare Dashboard 打开 `Workers & Pages -> <项目> -> Deployments`。
2. 找到上一个已验证的 production deployment，使用 Dashboard 的回滚操作恢复。
3. 回滚后对正式地址重新运行 `pnpm smoke:deployment`。
4. 修复代码并合并新的 `main` commit，由 Git 集成生成后续部署。

## 测试方法

- 单测覆盖正式 URL、本地构建跳过和 Pages 构建强制校验。
- `pnpm build` 检查 `_headers` 已复制到 `out` 且包含必需规则。
- `pnpm test:e2e` 在静态构建产物上覆盖完整站内用户流程。
- 公网冒烟已对 deployment 地址、`yeton-blog.pages.dev` 和 `blog1.chaosyn.com` 执行通过。

## 当前限制

- 仓库、Pages 项目、正式域名和首次生产发布已经打通；当前生产提交为 `49b13a9`。
- Git 集成触发的首次构建没有读到 Dashboard 中的 `NEXT_PUBLIC_SITE_URL`。Wrangler 直传已经恢复线上发布，Git 自动构建仍需重新触发并确认变量作用于 Production 构建环境。
- 任意未知 `/en/*` 地址仍使用根目录中文 `404.html`；显式英文 `/en/404/` 可访问。
