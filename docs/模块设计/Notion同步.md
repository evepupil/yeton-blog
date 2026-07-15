# Notion 同步

> **模块定位**：把 Notion 文章与友链安全、可重复地同步到仓库内容
>
> **对应代码**：`lib/notion-sync/`、`scripts/sync-notion.ts`、`scripts/sync-notion-friends.ts`、`.github/workflows/sync-notion.yml`
>
> **所属 M 里程碑**：[M7：评论、同步与统计](../roadmap.md#阶段-7评论同步与统计)
>
> **当前状态**：已完成
>
> **最近更新时间**：2026-07-16

## 设计

### 职责

本模块负责从 Notion 拉取已发布文章和已通过友链，把页面转换为仓库内的 Markdown、JSON 和本地图片，再交给现有内容校验与 Cloudflare Git 部署流程。它不在网页请求期间访问 Notion，也不负责评论、访问统计和友链页面样式。

### 目录结构

| 路径                                | 用途                                            |
| ----------------------------------- | ----------------------------------------------- |
| `lib/notion-sync/properties.ts`     | 按 Notion 属性类型读取字段                      |
| `lib/notion-sync/article.ts`        | 文章字段映射、摘要和 frontmatter 生成           |
| `lib/notion-sync/friends.ts`        | 友链字段映射                                    |
| `lib/notion-sync/images.ts`         | 图片校验、限流下载、Markdown 链接替换与目录切换 |
| `lib/notion-sync/store.ts`          | 文章归属识别、幂等写入和过期内容清理            |
| `lib/notion-sync/client.ts`         | Notion 分页查询和页面转 Markdown                |
| `lib/notion-sync/sync.ts`           | 文章与友链同步流程                              |
| `scripts/sync-notion.ts`            | 文章同步 CLI                                    |
| `scripts/sync-notion-friends.ts`    | 友链同步 CLI                                    |
| `.github/workflows/sync-notion.yml` | 定时同步、校验、commit 和 push                  |
| `tests/unit/notion-sync.test.ts`    | 映射、幂等、文件保护、slug 和图片规则测试       |

### 关键决策

1. 参考实现来自 `D:\myproject\notion-fuwari`，保留它的数据库字段和每天北京时间 0 点同步习惯。
2. Notion 内容先写入 Git。Cloudflare Pages 监听 `main` commit 自动构建，Action 不需要任何 Cloudflare 凭据。
3. 文章 slug 使用不含空格的小写 kebab-case，可包含中文等 Unicode 字母。Notion 可填写 `Slug`；未填写时使用标题中的 ASCII 单词加页面 ID 前 8 位，纯中文标题使用 `notion-<页面 ID>`。
4. 同步文章带 `source: "notion"` 与 `notionPageId`。覆盖和清理只处理这种文章，遇到同 slug 手写文件会停止同步。
5. 正文图、封面和友链头像下载到 `public/`。只接受 HTTP/HTTPS 和 JPEG、PNG、GIF、WebP、AVIF，单张图片上限 10 MB，超时为 30 秒。
6. 图片先写临时目录，整篇处理成功后替换正式目录。任意图片失败会让 Action 失败，仓库不会得到半成品 commit。
7. 默认 `overwrite` 在成功获取至少一篇发布文章后才清理过期 Notion 文章。发布查询返回空列表时保留现有文章，避免字段或权限错误造成批量删除。

## 改动历史

### 2026-07-16

- 清理“Giscus 与访问统计待接入”的过期说明，明确同步模块与第三方展示服务的边界。

### 2026-07-15

- 增加 Notion SDK、Markdown 转换和本地环境变量依赖。
- 实现文章、友链和图片同步，接入现有严格内容 schema。
- 增加 `overwrite`、`new-only`、`append` 模式和手写文章保护。
- 增加每天北京时间 0 点与手动触发的 GitHub Action。
- 增加同步映射、幂等写入、图片路径和异常边界单测。
- 旧站迁移支持 Unicode Slug；在 Notion 填写旧文件名后，同步会持续写入同一文章 URL。

## 实现细节

### 环境变量

| 名称                             | 必需 | 用途                              |
| -------------------------------- | ---- | --------------------------------- |
| `NOTION_TOKEN`                   | 是   | Notion Integration Token          |
| `NOTION_DATABASE_ID`             | 是   | 文章数据库 ID                     |
| `NOTION_FRIEND_LINK_DATABASE_ID` | 否   | 友链数据库 ID，缺少时跳过友链同步 |
| `NOTION_PUBLISHED_STATUS`        | 否   | 发布状态名称，默认 `Published`    |

本地值放在被 Git 忽略的 `.env.local`。GitHub 中前三项放在 Actions Secrets；发布状态保持默认时无需配置。

仓库的 Actions Workflow permissions 需要允许写入内容。若 `main` 开启了分支保护，还需要允许 `github-actions[bot]` 提交同步结果，或为该 workflow 配置对应的绕过规则。

### 数据库字段

文章数据库必需字段为 `Title`、`Status`、`Published Date` 和 `Tags`，`Status` 类型为 Status。可选字段为 `Featured Image`、`Slug`、`Description`、`Locale` 和 `Translation Key`。`Locale` 支持 `zh-CN`、`Chinese`、`中文`、`en`、`English`、`英文`，缺省按中文处理。

从 notion-fuwari 迁移时，应先把每篇页面的 `Slug` 填成旧 Markdown 文件名。手动迁移的文件还要写入对应 `notionPageId` 和 `source: "notion"`；两边 page ID 一致后，定时同步才能安全更新原文件。

友链数据库沿用 `状态=已通过`、`网站名称`、`网站地址`、`网站描述`、`头像URL` 和 `提交时间`。名称与网址必须有效；头像存在时会下载为站内路径。

### 同步流程

1. CLI 读取 `.env.local`，校验 Token 和数据库 ID，不输出 Token。
2. 客户端分页查询文章，按 `Published Date` 倒序读取，并逐页转换 Markdown。
3. 映射函数校验标题、日期、标签、语言和 slug，再生成本站 frontmatter。
4. Markdown AST 找出远程图片，下载到临时目录并改为 `/images/notion/...` 站内路径。
5. 文件层检查目标是否属于 Notion。手写文件冲突会报错，Notion 文件按模式新增、更新或跳过。
6. 默认模式清理不再发布的 Notion 文件与对应图片，随后 `pnpm content:check` 再做整站内容校验。
7. Action 只暂存 `content/posts`、`data/friends.json` 和 `public/images` 的同步结果。无变化直接结束，有变化时普通提交并 push 到 `main`。

### 命令

```bash
pnpm sync-notion
pnpm sync-notion:new
pnpm sync-notion:append
pnpm sync-friends
pnpm sync-content
```

### 测试方法

- 字段映射测试使用与 Notion SDK 一致的页面结构，验证文章、友链和严格 frontmatter。
- 临时目录测试连续执行两次相同同步，第二次必须报告 `unchanged`，文件内容保持一致。
- 手写文件冲突测试确认同步报错且原正文保留。
- 图片测试验证类型识别、确定性命名、下载落盘和 Markdown 站内路径替换。

## 当前限制

- 当前机器未配置本项目的 Notion secrets，因此尚未对真实数据库执行首次同步。
- Notion 属性名和类型必须与上文一致；后续如调整数据库，应先更新映射和测试。
- 友链 JSON 与头像已经可以生成，友链页面和图片加载失败回退在阶段 7 后续任务实现。
- Giscus 和 Umami 访问统计已经接入；本模块只负责同步内容，不读取或写入这些服务的数据。
