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
3. 文章 slug 使用不含空格的小写 kebab-case，可包含中文等 Unicode 字母。首次同步时，Notion 可填写 `Slug`；未填写则使用标题中的 ASCII 单词加页面 ID 前 8 位，纯中文标题使用 `notion-<页面 ID>`。后续同步按 `notionPageId` 复用已落盘 slug，标题变化不会重复建文；显式修改 Notion `Slug` 才会主动换地址。Notion 未填写 `Translation Key` 时也会保留本地已有值，避免覆盖时断开双语文章关系。
4. 同步文章带 `source: "notion"` 与 `notionPageId`。覆盖和清理只处理这种文章，遇到同 slug 手写文件会停止同步。
5. 正文图、封面和友链头像下载到 `public/`。下载传输沿用参考项目已在线验证的 Node.js 原生 HTTP/HTTPS 请求与手动重定向，不附加自定义请求头；只接受 HTTP/HTTPS 和 JPEG、PNG、GIF、WebP、AVIF，单张图片上限 10 MB，超时为 30 秒。
6. 图片先写临时目录，处理完成后替换正式目录。单张正文图片失败时沿用参考脚本的规则：打印中文警告、保留远程地址并继续；封面失败时省略封面，友链头像失败时交给页面首字母回退。Notion 查询、字段校验、文件冲突等内容错误仍会终止 Action。
7. 默认 `overwrite` 在成功获取至少一篇发布文章后才清理过期 Notion 文章。发布查询返回空列表时保留现有文章，避免字段或权限错误造成批量删除。

## 改动历史

### 2026-07-16

- 首次真实同步后，将 18 篇 Notion 文章收敛到新 slug，并按页面 ID 固定后续写入路径和已有译文键，避免标题调整再次产生重复文件或断开双语关系。
- 旧手写副本清理后由集中式重定向配置承接原 URL，Notion 同步只维护新 canonical 文件。
- Notion Markdown 在写入前使用仓库 Prettier 规则格式化，保证同步提交可以直接通过 Quality 格式门禁，并保持重复同步无差异。
- 对齐参考脚本的图片失败规则，知乎等图床返回 403 时保留文章并继续同步，避免单张远程图片阻断全部内容。
- 增加逐篇文章、图片下载、文件写入、清理结果和汇总统计的中文 Action 日志。
- 修复 GitHub Actions 下载 Notion 图片返回 403：复用参考项目的原生 HTTP/HTTPS 下载方式，保留当前项目的重定向上限、超时、体积和文件签名校验。
- 下载错误只记录图片来源域名，不记录可能包含临时签名的完整 URL。
- 清理“Giscus 与访问统计待接入”的过期说明，明确同步模块与第三方展示服务的边界。
- 友链页面已接入同步产物，公共友链 schema 移到 `lib/friends/`，页面和同步流程使用同一套校验规则。

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
3. 同步器先按 `notionPageId` 扫描现有 Notion 文件；映射函数校验标题、日期、标签和语言，Notion 未显式填写 `Slug` 时复用现有文件名，再生成本站 frontmatter。
4. Markdown AST 找出远程图片，逐张打印下载结果；成功时保存到临时目录并改为 `/images/notion/...` 站内路径，失败时保留远程地址并继续。
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
- slug 稳定性测试修改同一 Notion 页面标题，确认同步仍更新原文件、保留本地译文键且不会生成第二个路径。
- 手写文件冲突测试确认同步报错且原正文保留。
- 图片测试验证类型识别、确定性命名、下载落盘、Markdown 站内路径替换，以及正文、封面和友链头像遇到 403 时继续同步。

## 当前限制

- 当前机器未配置本项目的 Notion secrets，因此尚未对真实数据库执行首次同步。
- Notion 属性名和类型必须与上文一致；后续如调整数据库，应先更新映射和测试。
- 下载失败的正文图片会继续使用原远程地址，远端图床仍可能限制浏览器访问；同步日志会显示来源域名，便于后续把问题图片迁移到可下载的图床。
- 友链 JSON 与头像会直接进入中英文友链页面；浏览器加载头像失败时显示站名首字母。
- Giscus 和 Umami 访问统计已经接入；本模块只负责同步内容，不读取或写入这些服务的数据。
