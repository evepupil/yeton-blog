# AI 搜索

> **模块定位**：使用 Cloudflare AutoRAG 回答站内内容问题，并给出可返回原文的引用
>
> **对应代码**：`functions/api/ai-search.ts`、`lib/ai-search/`、`features/ai-search/`、`migrations/ai-search/`、`site.config.ts`、`wrangler.jsonc`
>
> **所属 M 里程碑**：[M8：AI 搜索与高级能力](../roadmap.md#阶段-8ai-搜索与高级能力)
>
> **当前状态**：进行中
>
> **最近更新时间**：2026-07-16

## 职责与边界

AI 搜索只负责基于博客内容回答问题。现有 MiniSearch 继续提供浏览器内关键词搜索，两套能力相互独立。AI 接口、AutoRAG 或额度异常时，文章、图书和普通搜索仍能正常使用。

模块包含四部分：

| 路径                             | 职责                                |
| -------------------------------- | ----------------------------------- |
| `site.config.ts`                 | 统一保存公开开关、模型和检索参数    |
| `functions/api/ai-search.ts`     | 校验、限流、调用 AutoRAG 和输出流   |
| `lib/ai-search/`                 | 请求、SSE、响应文本和引用映射纯函数 |
| `features/ai-search/`            | HeroUI Drawer、消息状态、停止和重试 |
| `migrations/ai-search/`          | D1 限流表与索引迁移                 |
| `public/_routes.json`            | 只让 `/api/*` 请求进入 Worker       |
| `tests/unit/ai-search-*.test.ts` | 核心协议、接口和浏览器客户端单测    |
| `tests/e2e/ai-search.spec.ts`    | 提问、停止、失败重试和引用跳转      |

## 结构与数据流

```text
读者点击 AI 搜索
  -> 浏览器按需加载 Drawer
  -> POST /api/ai-search
  -> 同源、输入、D1 用户限流、D1 全站限流
  -> AutoRAG search() 检索可用站内引用
  -> 有引用时调用 AutoRAG aiSearch() 生成回答
  -> 上游文本统一转为增量 SSE
  -> 显示回答和站内引用
```

接口只接受 `{ "query": string }`。返回使用四类 SSE 事件：

| 事件        | 内容                         |
| ----------- | ---------------------------- |
| `delta`     | 本次新增的回答文本           |
| `citations` | 最多 5 个站内文章引用        |
| `done`      | 本次请求 ID                  |
| `error`     | 错误码、请求 ID 和可重试标记 |

## 关键决策

1. 复用参考项目 `D:\myproject\notion-fuwari` 已跑通的 `AI` binding、`purple-rain-8860` AutoRAG、Llama 3.3 模型、BGE 重排模型和检索参数。
2. AutoRAG 在不同部署中可能发送逐段文本或累计回答。服务端自动识别两种格式，统一输出不重复的 `delta`。
3. SSE 解析保留未完成的网络分片，支持 `\n`、`\r\n` 和多行 `data`。格式异常会返回统一错误事件。
4. 流式 `aiSearch()` 只稳定返回回答文本，来源数组可能始终为空。Function 先调用 `search()` 获取引用，有可映射到站内文章的结果才启动 `aiSearch()`；旧文件名和旧文章 URL 经过 `redirects.config.ts` 转为当前 canonical slug。
5. Cloudflare Pages 不支持 Workers 原生 Rate Limit binding。限流改用 Pages 支持的 D1 binding，两条 UPSERT 在同一批次中原子执行；每个来源每分钟最多 6 次，全站每分钟最多 30 次。
6. 接口最多接收 500 个 Unicode 字符，调用和读取响应都受 30 秒超时约束。
7. Function 不记录问题、原始 IP 或回答正文。用户计数键使用按天轮换的 SHA-256 哈希，超过两天的旧计数由低频抽样任务清理；日志只写请求 ID、阶段、耗时、错误码和计数。
8. Drawer 在读者第一次点击浮动按钮后才加载。关闭 Drawer 或点击停止会取消浏览器请求，并继续保留已收到的部分文字。
9. Pages Git 上传阶段没有稳定识别源码 `functions/`，也不会继续编译 `_worker.js` 目录。正式构建会直接生成单文件 `out/_worker.js`，`_routes.json` 只包含 `/api/*`，静态页面不经过 Worker。

## 当前实现

- 中英文入口、输入框、流式消息、停止、重试和引用列表均已实现。
- 引用读取来源及其 `attributes` 中的 `filename`、`path`、`url`，支持 Markdown、`/posts/*`、旧 `/posts/en/*`、`/en/posts/*` 和 `index.html` 路径。
- 引用优先使用 AutoRAG 返回的标题；缺少标题时根据原始文件名或 URL slug 生成可读名称。
- 检索与生成分成两步：检索无站内引用时直接返回 `NO_CITATIONS`，不会继续消耗生成额度。
- 旧中文文件名通过集中重定向配置映射到新 slug，英文路径保持在 `/en/posts/*`。
- AI 或 D1 binding 缺失、D1 读写失败时返回 `503`。达到用户或全站阈值时返回 `429` 和 `Retry-After: 60`。
- JSON 错误与流式错误使用同一组错误码，客户端按当前语言显示说明。
- 普通 CI 使用受控替身，不会调用真实 AutoRAG，也不会消耗 AI 额度。
- production 和 preview 已配置 `AI`、`AI_RATE_LIMIT_DB`，D1 初始迁移已执行。
- preview `a0a3bc12` 已用真实 AutoRAG 返回 `citations -> delta -> done`，旧中英文 URL 均映射到当前文章，D1 同时写入用户和全站计数；等待同一实现通过 Git deployment 进入 production。
- `pnpm build` 会生成 Pages 高级模式 Worker 和 API 路由清单，静态产物检查会拒绝缺失 Worker 或扩大路由范围的构建。

## 验证方式

```bash
pnpm typecheck
pnpm test:unit
pnpm test:e2e
pnpm functions:build
pnpm build
```

单测覆盖输入、同源校验、D1 固定窗口、每日哈希轮换、跨分片 SSE、逐段/累计文本、引用映射、结构化错误和客户端完成条件。Playwright 拦截 `/api/ai-search`，覆盖成功回答、停止、失败重试和点击引用。

preview 已完成真实请求和浏览器流程：接口返回站内引用、增量回答与完成事件，引用在同一标签页进入 canonical 原文，D1 有对应限流计数，浏览器控制台无错误。生产发布后重跑同一问题并复查 D1，即可把 M8 标记为“已完成”。

## 待扩展项

- AutoRAG 数据源增加新的来源字段或路由形态时，再扩展集中引用解析器。
- 观察一段时间的 D1 限流命中和额度使用后，再调整每用户与全站阈值。
- 需要多轮对话时再增加上下文窗口；当前每次提问独立，成本和引用范围更容易控制。
- 增加生产冒烟中的 AI 可用性检查时，应使用低频固定问题并和普通静态冒烟分开，避免每次部署无意消耗额度。

## 改动历史

### 2026-07-16

- 增加 Cloudflare Pages Function、AI binding、双限流和超时保护。
- 增加严格类型的 SSE 协议、逐段/累计文本转换与旧 slug 引用映射。
- 增加按需加载的 HeroUI Drawer、中英文文案、停止、重试和引用跳转。
- 增加核心单测与 Playwright 用户流程。
- 将 Pages 不支持的原生限流 binding 改为 D1 原子计数，创建 APAC 数据库并执行初始迁移。
- 将引用检索与回答生成拆成两步，兼容真实 AutoRAG 网页 URL 来源、旧中英文路径和可读标题，并完成 preview 真请求与 D1 计数验证。
