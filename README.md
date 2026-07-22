# 潮思 Chaosyn

[![Quality](https://github.com/evepupil/yeton-blog/actions/workflows/quality.yml/badge.svg)](https://github.com/evepupil/yeton-blog/actions/workflows/quality.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com/)

潮思 Chaosyn 是一个面向长期写作的双语个人博客。它使用 Next.js、HeroUI 和 Tailwind CSS 构建，通过 Markdown/MDX 管理内容，并输出可部署到 Cloudflare Pages 的静态站点。

- 在线站点：[blog.chaosyn.com](https://blog.chaosyn.com)
- 内容语言：简体中文、English
- 部署方式：Cloudflare Pages Git 集成

## 功能

- Markdown/MDX 文章、标签、归档、图书与章节阅读
- 中英文独立路由、翻译关联、RSS、站点地图与 SEO 元数据
- 构建期全文搜索，以及可选的 Cloudflare AutoRAG AI 搜索
- Giscus 评论、Umami/Google Analytics、广告位和微信赞赏
- Notion 文章与友链同步、微信读书公开状态同步
- 响应式布局、明暗主题、键盘操作与无 JavaScript 阅读路径
- 严格 TypeScript、内容校验、单元测试、端到端测试和静态产物检查

所有第三方集成都可以独立关闭。关闭评论、统计、广告或 AI 搜索后，基础阅读流程仍然可用。

## 技术栈

| 领域      | 方案                                       |
| --------- | ------------------------------------------ |
| Web 框架  | Next.js 16 App Router、React 19            |
| 开发语言  | TypeScript 严格模式                        |
| UI 与样式 | HeroUI 3、Tailwind CSS 4                   |
| 内容      | Markdown/MDX、Zod、仓库内静态文件          |
| 搜索      | MiniSearch、Cloudflare AutoRAG（可选）     |
| 动态能力  | Cloudflare Pages Functions、Workers AI、D1 |
| 部署      | Cloudflare Pages 静态导出                  |
| 测试      | Vitest、Node Test Runner、Playwright       |

## 快速开始

### 环境要求

- Node.js `22.14.x`
- pnpm `10.21.0`

### 本地运行

```bash
git clone https://github.com/evepupil/yeton-blog.git
cd yeton-blog
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

浏览器访问 `http://localhost:3000`。

`NEXT_PUBLIC_SITE_URL` 用于生成 canonical、RSS 和分享地址。本地开发可以保留 `.env.example` 中的示例值，生产构建必须改成真实的 HTTPS 域名。

## 配置站点

公开配置集中在 [`site.config.ts`](site.config.ts)：

- `brand`：站点名称、字标、简介、页脚和默认分享图
- `author`：作者名称、头像、签名和关于页内容
- `sectionDescriptions`：文章、归档、图书和友链栏目说明
- `socialLinks`：社交链接及开关
- `integrations`：评论、统计、广告、赞赏和 AI 搜索
- `profileStatus`：GitHub、微信读书、TokenBoard 和技术雷达

这个文件会进入浏览器构建产物，只应保存公开信息。Notion Token、微信读书 API Key 等私密值放在 `.env.local` 或部署平台的 Secret 中。

替换站点时还应检查：

- `public/images/` 中的头像、分享图和赞赏二维码
- `wrangler.jsonc` 中的 Pages 项目名、D1 数据库和绑定
- `site.config.ts` 中的 Giscus 仓库、统计标识与外部链接
- `NEXT_PUBLIC_SITE_URL` 对应的正式域名

## 编写内容

```text
content/
├── posts/
│   ├── zh/                  # 中文文章
│   └── en/                  # 英文文章
└── books/
    ├── zh/<book-slug>/      # index.md + 章节 Markdown
    └── en/<book-slug>/
```

文章文件名会成为 URL slug，使用小写 kebab-case。文章 frontmatter 至少包含 `title`、`description`、`published`、`locale` 和 `tags`。中英文译文通过相同的 `translationKey` 关联。

图片放在 `public/` 下，内容中使用以 `/` 开头的站内路径。提交内容前运行：

```bash
pnpm content:check
```

更完整的字段、图书章节和校验规则见 [`docs/模块设计/内容系统.md`](docs/模块设计/内容系统.md)。

## 可选数据同步

复制 `.env.example` 为 `.env.local`，按需填写对应变量：

| 集成        | 环境变量                                         | 命令                |
| ----------- | ------------------------------------------------ | ------------------- |
| Notion 文章 | `NOTION_TOKEN`、`NOTION_DATABASE_ID`             | `pnpm sync-notion`  |
| Notion 友链 | `NOTION_TOKEN`、`NOTION_FRIEND_LINK_DATABASE_ID` | `pnpm sync-friends` |
| 微信读书    | `WEREAD_API_KEY`                                 | `pnpm sync-weread`  |

仓库内的 GitHub Actions 可以定时同步这些公开数据。没有配置相应 Secret 时，微信读书任务会跳过同步并保留现有数据。

## 常用命令

| 命令                 | 用途                                    |
| -------------------- | --------------------------------------- |
| `pnpm dev`           | 启动本地开发环境                        |
| `pnpm build`         | 校验内容、生成索引并构建完整 Pages 产物 |
| `pnpm preview`       | 使用 Wrangler 预览 `out`                |
| `pnpm content:check` | 校验文章和图书内容                      |
| `pnpm search:build`  | 生成中英文搜索索引                      |
| `pnpm format:check`  | 检查代码与文档格式                      |
| `pnpm lint`          | 运行 ESLint                             |
| `pnpm typecheck`     | 运行严格 TypeScript 检查                |
| `pnpm test`          | 运行单元测试和内容逻辑测试              |
| `pnpm test:e2e`      | 构建站点并运行 Playwright 用户流程      |
| `pnpm site:check`    | 检查已有 `out` 产物的链接和资源         |

## 部署到 Cloudflare Pages

1. 在 Cloudflare Pages 中关联 GitHub 仓库。
2. 选择 Node.js `22.14.0` 和 pnpm `10.21.0`。
3. 设置生产构建命令：

   ```bash
   NEXT_PUBLIC_SITE_URL=https://your-domain.example pnpm build
   ```

4. 将输出目录设置为 `out`。
5. 按需配置 Pages Functions 使用的 Workers AI、AutoRAG 和 D1 绑定。

GitHub Actions 负责格式、静态分析、类型、测试和构建检查；Cloudflare Pages 监听 `main` 并发布通过构建的静态产物。详细配置与回滚方式见 [`docs/模块设计/Cloudflare部署.md`](docs/模块设计/Cloudflare部署.md)。

## 项目结构

```text
app/            Next.js 页面、布局和站点元数据
components/     通用 UI 与布局组件
features/       按业务能力拆分的页面模块
lib/            内容、SEO、配置与共享逻辑
content/        Markdown/MDX 文章和图书
data/           友链与公开阅读状态
functions/      Cloudflare Pages Functions
scripts/        构建、校验和数据同步脚本
tests/          单元测试与端到端测试
docs/           路线图和模块设计文档
```

## 质量检查

提交前运行完整门禁：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
git diff --check
```

## 文档

- [实现路线图](docs/roadmap.md)
- [站点公共配置](docs/模块设计/站点公共配置.md)
- [内容系统](docs/模块设计/内容系统.md)
- [搜索、SEO 与站点完整性](docs/模块设计/搜索SEO与站点完整性.md)
- [Cloudflare Pages 部署](docs/模块设计/Cloudflare部署.md)
- [全部模块设计文档](docs/模块设计/)

## 参与贡献

欢迎通过 Issue 报告问题或讨论功能，通过 Pull Request 提交改进。提交代码前请确认完整质量门禁通过，并同步更新受影响的模块设计文档。
