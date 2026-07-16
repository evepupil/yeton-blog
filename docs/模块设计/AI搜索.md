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
  -> Cloudflare AI binding 调用 AutoRAG
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
4. 回答结束时必须有可映射到站内文章的引用。旧文件名先经过 `redirects.config.ts` 转为当前 canonical slug；没有有效引用时整次请求按失败处理。
5. Cloudflare Pages 不支持 Workers 原生 Rate Limit binding。限流改用 Pages 支持的 D1 binding，两条 UPSERT 在同一批次中原子执行；每个来源每分钟最多 6 次，全站每分钟最多 30 次。
6. 接口最多接收 500 个 Unicode 字符，调用和读取响应都受 30 秒超时约束。
7. Function 不记录问题、原始 IP 或回答正文。用户计数键使用按天轮换的 SHA-256 哈希，超过两天的旧计数由低频抽样任务清理；日志只写请求 ID、阶段、耗时、错误码和计数。
8. Drawer 在读者第一次点击浮动按钮后才加载。关闭 Drawer 或点击停止会取消浏览器请求，并继续保留已收到的部分文字。
9. Pages Git 上传阶段没有稳定识别源码 `functions/`。正式构建会先把它编译为 `out/_worker.js/index.js`，`_routes.json` 只包含 `/api/*`，静态页面不经过 Worker。

## 当前实现

- 中英文入口、输入框、流式消息、停止、重试和引用列表均已实现。
- 引用优先使用 AutoRAG 返回的标题；缺少标题时根据文件名生成可读名称。
- 旧中文文件名通过集中重定向配置映射到新 slug，英文路径保持在 `/en/posts/*`。
- AI 或 D1 binding 缺失、D1 读写失败时返回 `503`。达到用户或全站阈值时返回 `429` 和 `Retry-After: 60`。
- JSON 错误与流式错误使用同一组错误码，客户端按当前语言显示说明。
- 普通 CI 使用受控替身，不会调用真实 AutoRAG，也不会消耗 AI 额度。
- production 已配置 `AI` 和 `AI_RATE_LIMIT_DB`，D1 初始迁移已执行；等待下一次 Git deployment 做真实回答验证。
- `pnpm build` 会生成 Pages 高级模式 Worker 和 API 路由清单，静态产物检查会拒绝缺失 Worker 或扩大路由范围的构建。

## 验证方式

```bash
pnpm typecheck
pnpm test:unit
pnpm test:e2e
pnpm exec wrangler pages functions build
pnpm build
```

单测覆盖输入、同源校验、D1 固定窗口、每日哈希轮换、跨分片 SSE、逐段/累计文本、引用映射、结构化错误和客户端完成条件。Playwright 拦截 `/api/ai-search`，覆盖成功回答、停止、失败重试和点击引用。

生产发布后还需真实请求 `/api/ai-search`，确认 Cloudflare 项目识别 `AI` 与 `AI_RATE_LIMIT_DB`，AutoRAG 返回带引用的回答，并检查日志没有问题、IP 或回答正文。完成这一步后才能把 M8 标记为“已完成”。

## 待扩展项

- 根据真实 AutoRAG 来源字段补充更精确的文章标题元数据。
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
