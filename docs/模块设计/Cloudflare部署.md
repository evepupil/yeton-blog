# Cloudflare Pages 部署

## 设计

### 职责

本模块负责把通过质量门禁的 `main` 提交构建成生产静态站点，上传到 Cloudflare Pages，并在公网地址上检查关键路由、订阅文件、搜索索引、404 和安全响应头。它不负责购买域名、管理 Cloudflare 账号成员或替用户保存 API Token。

### 目录结构

| 路径                                   | 用途                                |
| -------------------------------------- | ----------------------------------- |
| `.github/workflows/quality.yml`        | PR 质量门禁与 `main` 生产部署       |
| `.node-version`、`.nvmrc`              | 锁定 Node.js 22.14.0                |
| `wrangler.jsonc`                       | Pages 项目名、兼容日期和输出目录    |
| `public/_headers`                      | 静态资源缓存和生产安全响应头        |
| `lib/deployment/config.ts`             | 生产 URL 与 Cloudflare 环境变量校验 |
| `scripts/deploy-pages.ts`              | 跨 Windows/Linux 的构建与上传入口   |
| `scripts/smoke-deployment.ts`          | 部署后公网 HTTP 冒烟检查            |
| `scripts/validate-production-env.ts`   | 上传前环境检查                      |
| `tests/unit/deployment-config.test.ts` | 生产配置纯函数单测                  |

### 关键决策

1. PR 只执行质量 job。`main` 的质量 job 全部通过后，production job 才能构建和上传。
2. 生产 job 必须重新构建。canonical、RSS 和 sitemap 依赖真实 `NEXT_PUBLIC_SITE_URL`，不能复用缺省本地地址生成的产物。
3. Node.js 固定为 `22.14.0`，pnpm 固定为 `10.21.0`，Wrangler 使用仓库依赖中的 `4.110.0`。
4. 部署脚本读取环境变量并通过参数数组调用 Wrangler，不拼接 shell 命令，也不会输出 API Token。
5. `public/_headers` 为 HTML 设置立即校验缓存，为带内容哈希的 Next 静态资源设置一年 immutable 缓存；图片、搜索索引和订阅文件使用较短缓存。
6. CSP 只允许站内脚本、样式、字体、图片和请求。Next 和主题初始化需要内联脚本与样式，因此当前保留 `unsafe-inline`；接入评论或统计时必须同步收紧并扩展来源。
7. 部署后冒烟直接请求公网地址，最多重试 6 次，覆盖站点刚完成切换时的短暂传播时间。

## 改动历史

### 2026-07-15

- 锁定 Node.js 与 pnpm 版本，收紧 `package.json` Node 引擎范围。
- 增加生产 URL、Cloudflare Account ID、API Token 和 Pages 项目名校验。
- 增加跨平台 `pnpm deploy`，自动执行生产构建并附带 GitHub commit 信息上传 Pages。
- 在质量工作流中增加依赖 `quality` 的 production 部署 job。
- 增加 CSP、HSTS、权限策略、防嵌入、防 MIME 猜测和分层缓存规则。
- 增加首页、英文首页、文章、RSS、sitemap、robots、搜索索引和 404 的部署后冒烟检查。
- 将 `_headers` 纳入静态产物完整性检查，并为部署配置增加单测。

## 实现细节

### GitHub 环境配置

在仓库 `Settings -> Environments -> production` 配置：

| 类型     | 名称                       | 内容                                   |
| -------- | -------------------------- | -------------------------------------- |
| Secret   | `CLOUDFLARE_API_TOKEN`     | 具备目标账号 Cloudflare Pages 编辑权限 |
| Secret   | `CLOUDFLARE_ACCOUNT_ID`    | 32 位 Cloudflare Account ID            |
| Variable | `CLOUDFLARE_PAGES_PROJECT` | 默认 `hero-ui-blog`                    |
| Variable | `NEXT_PUBLIC_SITE_URL`     | 正式 HTTPS 站点 origin，例如自定义域名 |

`NEXT_PUBLIC_SITE_URL` 必须是 HTTPS origin，不能使用 localhost、`example.com`、子路径、查询参数或 hash。没有自定义域名时可先使用正式的 `https://<project>.pages.dev`。

### 首次启用

1. 在 Cloudflare Dashboard 创建名为 `hero-ui-blog` 的 Pages 项目，或在交互终端登录后执行 `pnpm exec wrangler pages project create hero-ui-blog`。
2. 在 Pages 项目绑定正式域名；确认 DNS 和 HTTPS 已生效。
3. 为本地仓库添加 Git remote，并把 `main` 推到目标 GitHub 仓库。
4. 在 GitHub `production` 环境配置上表中的 secrets 和 variables。
5. 推送新的 `main` 提交。Action 先跑完整质量门禁，再执行 `pnpm production:check`、`pnpm deploy` 和公网冒烟。

### 本地发布

在当前终端设置与 GitHub 相同的四个环境变量后执行：

```bash
pnpm production:check
pnpm deploy
pnpm smoke:deployment -- https://your-production-origin.example
```

本地 `pnpm deploy` 默认发布到 `main` 分支；GitHub Action 会自动附带当前 commit SHA 和提交信息。

### 冒烟范围

- 中文首页、英文首页和一篇真实中文文章返回 200；文章含 JSON-LD。
- 中英文 RSS、sitemap、robots 和中文搜索索引可解析且非空。
- 不存在路径返回自定义 404。
- 首页包含 CSP、Referrer Policy、`nosniff` 和防嵌入响应头。

### 回滚

1. 在 Cloudflare Dashboard 打开 `Workers & Pages -> hero-ui-blog -> Deployments`。
2. 找到上一个已通过冒烟的 production deployment，使用 Dashboard 的回滚操作恢复。
3. 回滚后对正式地址执行 `pnpm smoke:deployment -- <正式地址>`。
4. 在代码仓库修复问题并提交新的 `main`；不要删除仍可能用于回滚的历史 deployment。

Wrangler 4.110.0 提供 deployment 列表和删除命令，没有 CLI rollback 命令，因此生产回滚以 Dashboard 为准。也可以重新运行某个已知良好 commit 的 GitHub production job，生成一份新的相同版本部署。

## 测试方法

- 单测覆盖正式 URL、Pages 项目名、Account ID 和 API Token 的边界。
- `pnpm build` 检查 `_headers` 已复制到 `out` 且包含必需安全与缓存规则。
- `pnpm test:e2e` 在静态构建产物上覆盖完整站内用户流程。
- production job 上传后运行真实公网冒烟；这一步需要 Cloudflare 凭据、Pages 项目和可访问域名。

## 当前限制

- 当前机器的 Wrangler 登录已过期，也没有 Cloudflare 环境变量，无法在本地执行真实上传。
- 当前仓库没有 Git remote，GitHub Action 还不能被推送触发。
- 正式域名和 Pages 项目尚未从 Cloudflare 在线状态确认，阶段六仍处于等待外部配置的状态。
- 任意未知 `/en/*` 地址仍使用根目录中文 `404.html`；显式英文 `/en/404/` 可访问。若生产必须按路径返回不同语言，需要后续增加 Pages Function 路由。
