# Cloudflare Pages 部署

> **模块定位**：管理静态站点、Pages Functions 与 Cloudflare 生产发布约束
>
> **对应代码**：`wrangler.jsonc`、`.github/workflows/`、`public/_headers`、`scripts/smoke-deployment.ts`
>
> **所属 M 里程碑**：[M6：Cloudflare Pages 发布](../roadmap.md#阶段-6cloudflare-pages-发布) · [M9：广告、赞助与评论体验](../roadmap.md#阶段-9广告赞助与评论体验)
>
> **当前状态**：已完成
>
> **最近更新时间**：2026-07-16

## 设计

### 职责

本模块负责约定 Cloudflare Pages 从关联 Git 仓库构建本站时使用的运行版本、构建命令、输出目录、公开站点地址、缓存和安全响应头。GitHub Actions 只检查代码质量以及后续同步 Notion 内容，不调用 Wrangler 上传站点。

### 目录结构

| 路径                                   | 用途                                 |
| -------------------------------------- | ------------------------------------ |
| `.github/workflows/quality.yml`        | PR 与 `main` 的代码质量检查          |
| `.node-version`、`.nvmrc`              | 锁定 Node.js 22.14.0                 |
| `wrangler.jsonc`                       | Pages 输出目录、AI 与 D1 binding     |
| `public/_headers`                      | 静态资源缓存和生产安全响应头         |
| `public/_routes.json`                  | 只让 `/api/*` 进入 Pages Worker      |
| `redirects.config.ts`                  | 旧站路径和文章 slug 的集中映射       |
| `scripts/generate-redirects.ts`        | 生成 Pages 永久重定向文件            |
| `public/_redirects`                    | 构建生成的 Pages 永久重定向规则      |
| `lib/deployment/config.ts`             | Pages 构建时的公开站点 URL 校验      |
| `scripts/validate-cloudflare-build.ts` | 区分本地构建和 Cloudflare Pages 构建 |
| `scripts/smoke-deployment.ts`          | 部署后手动执行的公网 HTTP 冒烟       |
| `tests/unit/deployment-config.test.ts` | 构建环境纯函数单测                   |

### 关键决策

1. Cloudflare Pages 关联 Git 仓库并监听目标分支。仓库更新后由 Cloudflare 拉取代码、执行配置的构建命令并发布 `out`。
2. GitHub Action 不保存 Cloudflare API Token、Account ID 或 Pages 项目名，也不执行 `wrangler pages deploy`。
3. Notion 同步沿用参考项目 `D:\myproject\notion-fuwari` 的职责边界：Action 同步内容并推送 commit，Cloudflare 看到仓库更新后自动部署。
4. `NEXT_PUBLIC_SITE_URL` 用于 canonical、RSS、sitemap 和分享地址。Cloudflare 项目虽然保存了同名 Production/Preview 变量，Git 构建日志仍显示没有注入构建变量，因此正式域名同时写在 Pages 构建命令中，保证生产构建获得确定地址。
5. Node.js 固定为 `22.14.0`，pnpm 固定为 `10.21.0`。Cloudflare 构建命令和本地门禁使用同一份 lockfile。
6. `public/_headers` 为 HTML 设置立即校验缓存，为带内容哈希的 Next 静态资源设置一年 immutable 缓存；图片、搜索索引和订阅文件使用较短缓存。
7. CSP 允许站内资源、公共 HTTPS 图片、Giscus、Umami、Google Analytics 和 AdSense 当前需要的脚本、连接与 iframe。Next、主题与 GA4 初始化需要内联脚本和样式，因此当前保留 `unsafe-inline`；第三方服务增加来源时必须按实际请求补充并继续限制域名。
8. 旧站路径迁移在 `redirects.config.ts` 维护，构建时生成 Pages `_redirects` 并返回单跳 `301`。正式域名切换使用 Dashboard hostname Redirect Rule，避免同一份路径规则在 canonical 域名上循环。
9. AI 搜索使用 Pages Function、`AI` binding 和 D1 原子计数。Cloudflare Pages 不支持 Workers 原生 Rate Limit binding，因此每用户和全站阈值在同一个 D1 批次中更新；AI 或 D1 binding 缺失时接口返回 `503`。
10. `pnpm build` 将 `functions/` 编译为单文件 `out/_worker.js`。这能让 Pages Git 上传阶段直接识别动态接口，`_routes.json` 保证文章和静态资源继续由 Pages 资产服务处理。
11. Pages 项目名是 `yeton-blog`，仓库 Wrangler 名称保留应用名 `hero-ui-blog`。production binding 以 Dashboard 为准，避免 Git 上传器把仓库配置切成只发布静态产物的模式。

## 改动历史

### 2026-07-16

- 为 M9 放行 AdSense 的脚本、连接和 iframe 域名，并将域名与启用脚本检查加入静态产物门禁。
- 迁移 GA4 后放行 Google Tag Manager、`www.google-analytics.com` 与 `region1.google-analytics.com`；静态产物检查 Measurement ID 与 AdSense 账户元数据，Playwright 检查浏览器生成的脚本地址。
- 将 `_redirects` 改为集中配置生成，增加 18 篇旧文章 slug 到新 slug 的永久映射，并为带尾斜杠和不带尾斜杠的请求分别生成规则。
- 公网冒烟从配置读取文章迁移清单，逐条确认 Cloudflare 返回单跳 `301` 和正确目标。
- Pages 的规则文件使用百分号编码保存中文旧路径，和浏览器实际发送的请求路径保持一致。
- 为 M8 增加 Cloudflare AI 与 D1 binding；创建 APAC D1 数据库并应用限流表迁移，实现每用户 6 次/分钟、全站 30 次/分钟。
- Pages Git 项目的 production 已绑定 `AI_RATE_LIMIT_DB`；绑定通过 Cloudflare API 写入一次，后续代码和内容仍由 Git 集成自动部署。
- Pages Git 上传未稳定自动编译 `functions/`，构建命令改为显式生成高级模式 `_worker.js`，静态产物门禁同时检查 Worker 与 API 路由清单。

### 2026-07-15

- 锁定 Node.js 与 pnpm 版本，收紧 `package.json` Node 引擎范围。
- 增加 Cloudflare Pages 构建环境识别和真实 `NEXT_PUBLIC_SITE_URL` 校验。
- 保留 GitHub `Quality` 工作流，不增加重复的 Wrangler 上传 job。
- 增加 CSP、HSTS、权限策略、防嵌入、防 MIME 猜测和分层缓存规则。
- 增加首页、英文首页、文章、RSS、sitemap、robots、搜索索引和 404 的公网冒烟脚本。
- 将 `_headers` 纳入静态产物完整性检查，并为 Pages 构建配置增加单测。
- 根据参考项目确认部署模型后，删除主动上传所需的 Cloudflare secrets、variables 和部署脚本。
- 将 Git remote 关联到 `evepupil/yeton-blog`，确认 Cloudflare Pages 项目 `yeton-blog` 已连接该仓库。
- 早期使用 `https://blog1.chaosyn.com` 完成首次生产构建和公网冒烟，随后将 Pages 正式 origin 与构建命令切换到 `https://blog.chaosyn.com`。
- 根据失败 deployment 的服务端配置和构建日志确认变量已保存但未进入构建进程，将正式域名加入 Pages 构建命令后重试成功。
- 阶段 7 为 Giscus 增加 `https://giscus.app` 的 `script-src`、`connect-src` 和 `frame-src`，并将规则纳入静态产物检查。
- 阶段 7 为 Umami Cloud 增加 `https://cloud.umami.is` 的 `script-src` 与 `connect-src`，统计服务失败不影响静态站点。
- 将 Giscus、AdSense 和访问统计的公开参数集中到 `site.config.ts`，Pages 环境变量只保留部署地址与服务端密钥。
- 增加 notion-fuwari 旧路径重定向，并把规则检查和生产重定向冒烟加入发布流程。

## 实现细节

### Pages 项目设置

在 Cloudflare Dashboard 创建 Pages 项目并关联 Git 仓库，配置：

| 配置项               | 值                                                         |
| -------------------- | ---------------------------------------------------------- |
| Pages project        | `yeton-blog`                                               |
| Production branch    | `main`                                                     |
| Production origin    | `https://blog.chaosyn.com`                                 |
| Build command        | `NEXT_PUBLIC_SITE_URL=https://blog.chaosyn.com pnpm build` |
| Build output         | `out`                                                      |
| Root directory       | `/`                                                        |
| Node.js              | `22.14.0`                                                  |
| pnpm                 | `10.21.0`                                                  |
| Environment variable | `NEXT_PUBLIC_SITE_URL`                                     |

Pages Function 另外从 `wrangler.jsonc` 获取以下运行时 binding：

| Binding            | 用途                               |
| ------------------ | ---------------------------------- |
| `AI`               | 调用 AutoRAG AI Search             |
| `AI_RATE_LIMIT_DB` | 原子记录单个来源和全站每分钟请求数 |

首次部署或新建环境时执行：

```bash
pnpm ai-search:migrate
```

迁移目标是 `yeton-blog-ai-rate-limit`。数据库 ID 保存在 `wrangler.jsonc`，它是公开资源标识，不是访问凭据。

`NEXT_PUBLIC_SITE_URL` 当前填写 `https://blog.chaosyn.com`。没有自定义域名时可使用该项目的正式 `pages.dev` 地址。它不能使用 localhost、`example.com`、子路径、查询参数或 hash。

### 自动部署流程

1. Pull Request 通过 GitHub `Quality` 检查。
2. 合并到 `main` 后，Cloudflare Pages 的 Git 集成检测到新 commit。
3. Cloudflare 安装锁定依赖并运行配置的构建命令；命令先把正式域名传给 `pnpm build`。
4. 构建脚本先从 `redirects.config.ts` 生成 `_redirects`，再检测 `CF_PAGES=1`、校验传入的 `NEXT_PUBLIC_SITE_URL`，随后生成静态页面和 `out/_worker.js` 并检查完整产物。
5. Cloudflare 发布静态产物并保留 deployment 历史。

为了让质量门禁真正阻止坏版本进入生产分支，需要在 GitHub 为 `main` 开启分支保护，并把 `Quality / quality` 设为合并前必需检查。

### 正式域名状态

1. `blog.chaosyn.com` 已绑定到当前 Pages 项目。
2. Pages 构建命令与 `NEXT_PUBLIC_SITE_URL` 已同步为 `https://blog.chaosyn.com`。
3. `blog1.chaosyn.com` 如需保留，应在 Cloudflare Dashboard 使用只匹配该 hostname 的永久重定向，目标为 `https://blog.chaosyn.com/${path}`。
4. `redirects.config.ts` 继续维护旧站内部路径到当前 canonical 的单跳映射。
5. 每次域名或路由变更部署后，对正式域名运行公网冒烟，并确认 Google Search Console 和 Bing Webmaster Tools 使用当前 sitemap。

### Notion 同步关系

定时同步 Action 只执行：

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
- `pnpm build` 检查 `_headers` 已复制到 `out`，并确认生成的 `_redirects` 包含集中配置中的全部规则。
- `pnpm test:e2e` 在静态构建产物上覆盖完整站内用户流程。
- `wrangler pages functions build` 校验 Pages Function 可以和 AI、D1 binding 一起打包。
- 早期公网冒烟已覆盖 deployment 地址、`yeton-blog.pages.dev` 和临时域名；当前正式域名为 `blog.chaosyn.com`，本次路由改造发布后需要重新执行正式域名冒烟。

## 当前限制

- 仓库、Pages 项目、正式域名和 Git 来源的生产构建已经打通。
- Cloudflare Dashboard 变量与构建命令都保存了公开站点地址；正式域名变化时必须同步修改两处，避免 canonical、RSS 和 sitemap 继续使用旧地址。
- Giscus 的仓库、Discussions 分类、公开 ID 和生产 iframe 已经验证；更换仓库时需要重新生成整组公开参数。
- 当前站已经有 `/links/` 友链页，但旧站友链路径尚未加入迁移映射；赞助只有文章末尾入口，没有独立赞助页可作为旧地址目标。
- 任意未知 `/en/*` 地址仍使用根目录中文 `404.html`；显式英文 `/en/404/` 可访问。
