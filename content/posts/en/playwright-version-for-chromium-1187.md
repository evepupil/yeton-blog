---
title: "Playwright Version Matching Chromium 1187"
description: "While running crawl4ai on my home PC, I found that Chromium 1187 was missing. Installing the latest Playwright did not provide that browser revision."
published: "2025-11-24"
locale: "en"
tags: ["Troubleshooting"]
draft: false
pinned: false
translationKey: "chromium-1187对应版本的playwright版本"
---

While running crawl4ai on my home PC, I found that the required Playwright browser revision was missing. Installing the latest Playwright still did not include this exact revision.

```javascript
BrowserType.launch: Executable doesn't exist at C:\Users\Evepupil\AppData\Local\ms-playwright\chromium-1187\chrome-win\chrome.exe
```

After trying multiple versions, I found that:

```javascript
npm install @playwright/test@1.55.0
```

This version includes the exact Chromium 1187 browser build.

![image.png](/images/posts/chromium-1187对应版本的playwright版本/image-1.png)

After installing that Playwright version, install the matching Chromium with:

```javascript
npx playwright install chromium
```
