---
title: "Cloudflare AI Search (AutoRAG) Integration: Build a Knowledge Assistant for Your Blog"
description: "I recently added an AI assistant to my blog that can retrieve content and answer questions. This post summarizes the full integration process and key pitfalls when using Cloudflare AI Search (AutoRAG)."
published: "2026-01-13"
locale: "en"
tags: ["serverless", "Cloudflare", "RAG", "AI"]
draft: false
pinned: false
translationKey: "cloudflare-ai-search-autorag-接入实战-个人博客的知识库ai助手"
---

## Introduction

I recently added an AI assistant to my blog that can search posts and answer user questions. It is built with Cloudflare AI Search (also called AutoRAG). I hit several pitfalls, so I organized the full setup flow here.

**Preview**: click the chat button in the lower-right corner and ask, “Which posts are about Serverless?” It retrieves related content, answers the question, and shows citations.

## What is Cloudflare AI Search?

AI Search is Cloudflare’s **RAG (Retrieval-Augmented Generation)** service. In short:

1. You upload documents (web pages, PDFs, Markdown, etc.)
2. Cloudflare automatically builds vector indexes
3. On user queries, it retrieves relevant documents first, then generates answers grounded in those documents

Compared with self-hosted RAG:

- **Free quota**: 100,000 neural AI calls per day
- **Zero ops**: no vector DB or embedding infrastructure to manage
- **All-in-one**: retrieval + generation through one API

## 1. Create AI Search

### 1.1 Open the dashboard

Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/), then go to **AI** → **AI Search** in the left menu.

![image.png](/images/posts/cloudflare-ai-search-autorag-接入实战-个人博客的知识库ai助手/image-1.png)

### 1.2 Create an instance

Click **Create AI Search** and fill in:

- **Name**: any name, for example `my-blog-search` (used later in code)
- **Model**: choose a generation model, recommended `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (fast)

After creation, you will see the instance details page.

## 2. Add data sources

AI Search supports two ways to ingest data:

![image.png](/images/posts/cloudflare-ai-search-autorag-接入实战-个人博客的知识库ai助手/image-2.png)

### 2.1 Option A: Website URL (recommended)

Great for public websites. Cloudflare crawls pages automatically.

1. In AI Search details, click **use template**
2. Enter your site URL, for example [`https://blog.example.com`](https://blog.example.com/)
3. Click **Start Indexing**

After crawling, you can view all indexed pages in the Overview tab.

> **Pros**: auto-updates when site content changes
> **Cons**: your site must be publicly reachable

### 2.2 Option B: Upload files

Best for local/private documents.

1. In AI Search details, choose file-based source and configure it as needed.

![image.png](/images/posts/cloudflare-ai-search-autorag-接入实战-个人博客的知识库ai助手/image-3.png)

## 3. Test in dashboard

After data ingestion:

1. Open the AI Search instance details
2. Go to **Playground**
3. Ask something like “Which posts are about deployment?”
4. Check the answer and cited source documents

## 4. Code integration (practical)

Now the key part: how to call AI Search in your app. Example below uses an Astro blog project.

### 4.1 Configure AI binding

First, add AI binding in `wrangler.jsonc` (or `wrangler.toml`):

```json
{
  "name": "my-blog",
  "compatibility_date": "2025-08-11",
  "pages_build_output_dir": "./dist",
  "ai": {
    "binding": "AI"
  }
}
```

Then you can access AI services in Cloudflare Pages Functions via `env.AI`.

### 4.2 Call AI Search (key snippet)

```typescript
const result = await env.AI.autorag("my-blog-search").aiSearch({
  query: query.trim(),
  model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  rewrite_query: true,
  max_num_results: 5,
  ranking_options: { score_threshold: 0.3 },
  reranking: { enabled: true, model: "@cf/baai/bge-reranker-base" },
  stream: true,
});
```

### 4.3 Parameter guide

| Parameter           | Description               | Suggested value                     |
| ------------------- | ------------------------- | ----------------------------------- |
| `model`             | Generation model          | `llama-3.3-70b-instruct-fp8-fast`   |
| `rewrite_query`     | Rewrite user query        | `true`                              |
| `max_num_results`   | Number of retrieved docs  | `3-10`                              |
| `score_threshold`   | Relevance threshold (0-1) | `0.3` (too high may return nothing) |
| `reranking.enabled` | Enable reranking          | `true`                              |
| `stream`            | Stream response           | `true` (better UX)                  |

## 5. Streaming response handling (important)

When `stream: true` is enabled, AI Search returns SSE-formatted data, so the client must parse it correctly.

###

## 6. Deployment configuration

### 6.1 Configure Pages binding

Choose either this or **4.1 AI binding**, and **4.1** is recommended.

In Cloudflare Dashboard:

1. Open your Pages project → Settings → Bindings
2. Find **AI Bindings**
3. Click **Add binding**:
   - Variable name: `AI`
   - AI Search: select your instance
4. Click **Save**

### 6.2 Deploy

```bash
pnpm build
npx wrangler pages deploy dist
```

## Summary

Cloudflare AI Search significantly lowers the entry barrier for RAG: no need to run vector databases or embedding pipelines yourself. It also provides a generous daily free tier, which is usually enough for lightweight knowledge-assistant use cases.
