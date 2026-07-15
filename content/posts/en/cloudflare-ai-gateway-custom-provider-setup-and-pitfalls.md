---
title: "Cloudflare AI Gateway: Custom Provider Setup and Pitfalls"
description: "This note summarizes how we integrated Cloudflare AI Gateway with a custom provider in the Ankigenix project, plus several pitfalls that are easy to miss."
published: "2026-02-09"
locale: "en"
tags: ["Cloudflare", "AI"]
draft: false
pinned: false
translationKey: "cloudflare-ai-gateway-自定义供应商配置与踩坑记录"
---

### Cloudflare AI Gateway: Custom Provider Setup and Pitfalls

This post records how we integrated Cloudflare AI Gateway (custom provider mode) in Ankigenix and the main mistakes we hit, so we can reuse this during future reviews and team handoffs.

### Background and goals

We wanted all AI traffic to go through Cloudflare AI Gateway for:

- Unified traffic visibility and billing traceability
- Clearer request-level debugging paths
- Smaller code changes when switching providers later

At the same time, we are using a **custom provider** (for example, Xiaomi MiMo), not a built-in Cloudflare provider.

### Configure a custom AI provider in Cloudflare

1. Open the custom AI provider page.

![图片.png](/images/posts/cloudflare-ai-gateway-自定义供应商配置与踩坑记录/image-1.png)

2. Add your custom provider, and remember the provider `slug`.

![图片.png](/images/posts/cloudflare-ai-gateway-自定义供应商配置与踩坑记录/image-2.png)

### Gateway request shape (core takeaway)

AI Gateway does **not** manage provider authentication on your behalf. Even if provider credentials are configured in the Cloudflare dashboard, your request still needs the **provider API key**.

Typical request headers (OpenAI-compatible SDK example):

- `Authorization: Bearer <PROVIDER_API_KEY>`
- `cf-aig-authorization: Bearer <CF_AIG_TOKEN>` (if gateway auth is enabled)

In short: **the gateway token is not a replacement for the provider key**.

### `baseURL` format details

For custom providers, `baseURL` usually needs `/v1`:

```plain text
https://gateway.ai.cloudflare.com/v1/<account>/<gateway>/<provider>/v1
```

Example:

```plain text
https://gateway.ai.cloudflare.com/v1/ACCOUNT/GATEWAY/custom-xiaomi/v1
```

The SDK appends `chat/completions` automatically, so the trailing `/v1` matters.

### OpenAI SDK config (recommended)

Put gateway settings in environment variables and enable them conditionally at startup:

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.MIMO_API_KEY, // provider key
  baseURL: process.env.CF_AIG_BASE_URL,
  defaultHeaders: {
    "cf-aig-authorization": `Bearer ${process.env.CF_AIG_TOKEN}`,
  },
});
```

If `CF_AIG_BASE_URL` or `CF_AIG_TOKEN` is missing, fall back to calling the provider directly.

### Working `curl` example

(Using placeholders instead of real secrets.)

```bash
curl https://gateway.ai.cloudflare.com/v1/<account>/<gateway>/<custom-provider-slug>/v1/chat/completions \
	--header 'cf-aig-authorization: Bearer <CF_AIG_TOKEN>' \
	--header 'Authorization: Bearer <PROVIDER_API_KEY>' \
	--header 'Content-Type: application/json' \
	--data '{"model": "mimo-v2-flash", "messages": [{"role": "user", "content": "Hello"}]}'
```

### Pitfall log

1. **401: only CF token provided, provider key missing**
   - Most common misdiagnosis.
   - CF token only authenticates gateway access.
2. **Missing `/v1` in `baseURL`**
   - SDK appends endpoint paths.
   - Missing `/v1` often leads to 404/401.
3. **PM2 env not refreshed**
   - After changing env vars, run: `pm2 restart <name> --update-env`.
4. **Model and provider mismatch**
   - Custom providers usually use the native model name (for example `mimo-v2-flash`).
   - Different gateway routes may apply different rules; align with Cloudflare dashboard settings.

### Final config recommendations

- Centralize these env vars:
  - `CF_AIG_BASE_URL`
  - `CF_AIG_TOKEN`
  - `OPENAI_API_KEY` / `MIMO_API_KEY` / `DEEPSEEK_API_KEY`
- Route through gateway only when both `CF_AIG_BASE_URL` and `CF_AIG_TOKEN` are set.
- Even in gateway mode, **you still must send the provider API key**.

### Wrap-up

Cloudflare AI Gateway is excellent as an observability and routing layer, but it does not replace provider authentication.

This is especially true for custom providers: **gateway token + provider token are both required**.

Encode these constraints in project config and deployment scripts to keep the setup stable and reusable.
