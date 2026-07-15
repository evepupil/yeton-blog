---
title: "Cloudflare Worker Reverse Proxy Tutorial"
description: "A reverse proxy visits a target website on your behalf and returns the result to you. For example, instead of visiting example.com directly, you route traffic through Cloudflare Worker and let Worker return the response."
published: "2025-11-17"
locale: "en"
tags: ["Cloudflare", "Fun", "serverless"]
draft: false
pinned: false
image: "/images/posts/cloudflare-worker反向代理网站教程/cover.jpg"
translationKey: "cloudflare-worker反向代理网站教程"
---

## What is a reverse proxy?

A reverse proxy **accesses the target site on your behalf** and then returns the result. For example, instead of directly visiting `example.com`, you let Cloudflare Worker request it and return the response.

**Typical use cases:**

- Bypass geo restrictions
- Hide your real server address
- Access blocked websites
- Use your own domain to access target websites

## Prerequisites

1. **Cloudflare account** - sign up for free at [https://cloudflare.com](https://cloudflare.com/)
2. **Wrangler CLI** - `npm install -g wrangler`
3. **Wrangler login** - `wrangler login`

## Demo project (proxying an AI public relay site)

Repository: [https://github.com/evepupil/any-proxy](https://github.com/evepupil/any-proxy)

Live demo: [any.chaosyn.com](https://any.chaosyn.com/)

Note: direct access only works after binding a custom domain.

## Full code example

Create `worker.js`:

```plain text
/**
 * Cloudflare Worker reverse proxy
 * Purpose: proxy anyrouter.top
 */

// Target website
const TARGET_HOST = 'anyrouter.top';
const TARGET_URL = `https://${TARGET_HOST}`;

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Core request handler
 */
async function handleRequest(request) {
  try {
    // 1. Parse incoming URL
    const url = new URL(request.url);

    // 2. Build target URL (keep original path and query)
    const targetUrl = `${TARGET_URL}${url.pathname}${url.search}`;

    // 3. Copy and adjust headers
    const headers = new Headers(request.headers);
    headers.set('Host', TARGET_HOST);

    // 4. Build request options
    const requestOptions = {
      method: request.method,
      headers: headers,
      // Important: do not follow redirects automatically
      redirect: 'manual',
    };

    // 5. Forward request
    const response = await fetch(targetUrl, requestOptions);

    // 6. Handle redirect responses
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('Location');
      if (location && !location.startsWith(TARGET_HOST)) {
        // Forward external redirect
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      } else {
        // Block self-redirect loops
        return new Response('This site does not allow proxy access', {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    }

    // 7. Handle normal response
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    // 8. Remove conflicting security headers
    responseHeaders.delete('Content-Security-Policy');
    responseHeaders.delete('X-Frame-Options');

    // 9. Return response
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });

  } catch (error) {
    return new Response(`Proxy failed: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}
```

## Deployment steps

### Method 1: CLI (recommended)

**1. Initialize project**

```plain text
wrangler init any-proxy
cd any-proxy
```

**2. Create config file** `wrangler.toml`

```plain text
name = "any-proxy"
main = "worker.js"
compatibility_date = "2024-01-01"
workers_dev = true
```

**3. Deploy**

```plain text
wrangler deploy
```

**4. Get URL**
After deployment, you will see output like:

```plain text
Deployed any-proxy triggers (0.66 sec)
  https://any-proxy.your-subdomain.workers.dev
```

That URL is your proxy endpoint.

### Method 2: Dashboard

1. Log in to Cloudflare Dashboard
2. Go to “Workers & Pages”
3. Click “Create application” → “Create Worker”
4. Paste your code
5. Click “Save and Deploy”

## Bind a custom domain

**1. Add domain in Cloudflare**

If `your-domain.com` is managed by Cloudflare:

```plain text
# Add route to wrangler.toml
routes = [
  { pattern = "your-domain.com/*", zone_name = "your-domain.com" }
]
```

**2. Redeploy**

```plain text
wrangler deploy
```

**3. DNS settings**

Cloudflare handles DNS records automatically, so manual DNS setup is usually unnecessary.

## Common issues

### ❌ 500 error - “Too many redirects”

**Cause:** target site detects proxy access and keeps redirecting.

**Fix:** set `redirect: 'manual'` and handle redirects yourself (see code above).

### ❌ Static assets return 404

**Cause:** internal links are absolute URLs pointing to the origin domain.

**Fix:** add URL rewriting to replace origin-domain links with your proxy domain.

### ❌ CORS errors

**Fix:** include these response headers:

```plain text
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

## Advanced features

### 1. URL rewrite (force all resources through proxy)

```plain text
// Add this in response handling
const contentType = response.headers.get('content-type') || '';

if (contentType.includes('text/html') ||
    contentType.includes('text/javascript') ||
    contentType.includes('text/css')) {

  const text = await response.text();
  // Replace anyrouter.top with current proxy domain
  const rewrittenText = text.replace(/https:\/\/anyrouter\.top/g, proxyUrl);

  return new Response(rewrittenText, {
    status: response.status,
    headers: responseHeaders
  });
}
```

### 2. Add caching

```plain text
// Cache static assets for 1 hour
const cacheKey = new Request(url, request);
const cache = caches.default;

let response = await cache.match(cacheKey);
if (!response) {
  response = await fetch(targetUrl);
  // Store response in cache
  await cache.put(cacheKey, response.clone());
}
```

## Example project structure

```plain text
my-proxy/
├── worker.js          # Main program
├── wrangler.toml      # Configuration
└── package.json       # Dependencies (optional)
```

## Summary

1. **Core flow**: intercept request → forward to target → adjust response → return to client
2. **Key points**:
   - Adjust request headers (Host, Origin)
   - Disable auto-redirects
   - Add CORS support
   - Handle URL rewriting
3. **Deployment options**: Wrangler CLI or Dashboard UI

That’s it. You can now access target websites anywhere through your Cloudflare Worker.

![v2-683a9bd50c510a5be0bd0a22d71d0daf~resize:1440:q75.png](https://pic-out.zhimg.com/v2-683a9bd50c510a5be0bd0a22d71d0daf~resize:1440:q75.png?animatedImageAutoPlay=false&animatedImagePlayCount=1&auth_key=1763389800-0-0-3f607458cce2622cc6ece959199fc333&bizSceneCode=article_draft&expiration=1763389800&incremental=false&mid=d069498b8a955c3cdbf307c78b374d16&overTime=60&precoder=false&protocol=v2&retryCount=3&sampling=false&sceneCode=editor_copy_outbound&source=bfcaadb1)

## References

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
