---
title: "Pixiv Crawler: Common API Reference"
description: "While building a Pixiv crawler, I explored many Pixiv endpoints in depth. This article summarizes the main APIs, request patterns, and response structures based on real implementation experience."
published: "2025-10-08"
locale: "en"
tags: ["Crawler", "pixiv", "Fun"]
draft: false
pinned: false
image: "/images/posts/pixiv爬虫常用api的文档汇总/cover.jpg"
translationKey: "pixiv爬虫常用api的文档汇总"
---

## Introduction

During Pixiv crawler development, I investigated multiple Pixiv API endpoints in depth. This document summarizes commonly used APIs, request formats, and response structures from practical implementation work.

I also built a serverless Pixiv crawler recently:

[Pixiv爬虫/下载/代理，无需服务器即可一键部署！](<[https://blog.chaosyn.com/posts/pixiv爬虫-下载-代理-无需服务器即可一键部署/](https://blog.chaosyn.com/posts/pixiv%E7%88%AC%E8%99%AB-%E4%B8%8B%E8%BD%BD-%E4%BB%A3%E7%90%86-%E6%97%A0%E9%9C%80%E6%9C%8D%E5%8A%A1%E5%99%A8%E5%8D%B3%E5%8F%AF%E4%B8%80%E9%94%AE%E9%83%A8%E7%BD%B2/)>)

Example project:

https://github.com/evepupil/serverless_pixiv_crawlergithub.com/evepupil/serverless_pixiv_crawler

## Basic configuration

### Request headers

All API calls require proper headers, especially Cookie and User-Agent:

```plain text
interface PixivHeaders {
  'User-Agent': string;
  cookie: string;
  Referer: string;
  'Accept-Language': string;
}
```

### Common response format

Most Pixiv APIs follow this structure:

```plain text
{
  "error": false,
  "body": {
    // payload
  }
}
```

## Core API endpoints

### 1. Get illustration details

**Endpoint:** `https://www.pixiv.net/ajax/illust/{pid}`

**Method:** `GET`

**Parameters:**

- `pid`: illustration ID (required)

**Response structure:**

```plain text
interface PixivIllustInfo {
  body: {
    userId: string;          // author user ID
    title: string;           // illustration title
    userName: string;        // author username
    tags: {
      tags: Array<{
        tag: string;         // tag name
        translation?: {
          en: string;        // english translation
        };
      }>;
    };
    likeCount: number;       // likes
    bookmarkCount: number;   // bookmarks
    viewCount: number;       // views
    illusts?: Array<{ id: string }>; // related illustrations
    recommendUsers?: Array<{
      userId: string;
      illustIds: string[];
    }>;
  };
  error: boolean;
}
```

**Example:**

```plain text
const response = await axios.get(
  `https://www.pixiv.net/ajax/illust/123456789`,
  { headers: pixivHeaders }
);
const illustInfo: PixivIllustInfo = response.data;
```

### 2. Get illustration pages (image URLs)

**Endpoint:** `https://www.pixiv.net/ajax/illust/{pid}/pages?lang=zh`

**Method:** `GET`

**Parameters:**

- `pid`: illustration ID (required)
- `lang`: language (default `zh`)

**Response structure:**

```plain text
interface PixivIllustPagesResponse {
  body: Array<{
    urls: {
      original: string;      // original image
      regular: string;       // regular size
      small: string;         // small size
      thumb_mini: string;    // thumbnail
    };
  }>;
  error: boolean;
}
```

**Example:**

```plain text
const response = await axios.get(
  `https://www.pixiv.net/ajax/illust/123456789/pages?lang=zh`,
  { headers: pixivHeaders }
);
const pagesInfo: PixivIllustPagesResponse = response.data;
```

### 3. Get illustration recommendations

**Endpoint:** `https://www.pixiv.net/ajax/illust/{pid}/recommend/init?limit=30&lang=zh`

**Method:** `GET`

**Parameters:**

- `pid`: illustration ID (required)
- `limit`: number of results (default 30)
- `lang`: language (default `zh`)

**Response structure:**

```plain text
interface PixivRecommendResponse {
  body: {
    illusts: Array<{ id: string }>; // recommended illustration IDs
  };
  error: boolean;
}
```

**Example:**

```plain text
const response = await axios.get(
  `https://www.pixiv.net/ajax/illust/123456789/recommend/init?limit=30&lang=zh`,
  { headers: pixivHeaders }
);
const recommendInfo: PixivRecommendResponse = response.data;
```

### 4. Get user recommendations

**Endpoint:** `https://www.pixiv.net/ajax/user/{userId}/recommends?userNum=30&workNum=5&isR18=false&lang=zh`

**Method:** `GET`

**Parameters:**

- `userId`: user ID (required)
- `userNum`: number of recommended users (default 30)
- `workNum`: number of works per user (default 5)
- `isR18`: include R18 content (default false)
- `lang`: language (default `zh`)

**Response structure:**

```plain text
interface PixivUserRecommendResponse {
  body: {
    recommendUsers: Array<{
      userId: string;        // recommended user ID
      illustIds: string[];   // this user's illustration IDs
    }>;
  };
  error: boolean;
}
```

**Example:**

```plain text
const response = await axios.get(
  `https://www.pixiv.net/ajax/user/123456/recommends?userNum=30&workNum=5&isR18=false&lang=zh`,
  { headers: pixivHeaders }
);
const userRecommendInfo: PixivUserRecommendResponse = response.data;
```

## Ranking endpoint

### Fetch ranking data

**Endpoint:** `https://www.pixiv.net/ranking.php?mode={mode}&content=illust`

**Method:** `GET`

**Parameters:**

- `mode`: ranking type
- `daily`: daily ranking
- `weekly`: weekly ranking
- `monthly`: monthly ranking
- `content`: fixed as `illust`

**Note:** this endpoint returns HTML, so you need regex parsing to extract IDs.

**Parsing example:**

```plain text
// Regex for illustration IDs
const pidRegex = /<a\s+[^>]*href=["']\/artworks\/(\d+)["'][^>]*>/g;
const pids: string[] = [];
let match: RegExpExecArray | null;

while ((match = pidRegex.exec(html)) !== null) {
  pids.push(match[1]);
}
```

## Homepage recommendations

### Fetch homepage recommendation content

**Endpoint:** `https://www.pixiv.net/`

**Method:** `GET`

**Notes:** homepage recommendations are also parsed from HTML, usually by locating elements with the `data-gtm-work-id` attribute.

**Parsing example:**

```plain text
// Regex for recommended illustration IDs
const pidRegex = /data-gtm-work-id=["'](\d+)["']/gi;
const pids: string[] = [];
let match: RegExpExecArray | null;

while ((match = pidRegex.exec(html)) !== null) {
  pids.push(match[1]);
}
```

## Error handling

### Common error types

1. **404**: illustration does not exist or was deleted
2. **403**: insufficient permission or login required
3. **429**: rate limit exceeded

### Error handling example

```plain text
try {
  const response = await axios.get(apiUrl, { headers });
  return response.data;
} catch (error) {
  if (error.response?.status === 404) {
    console.log('Illustration not found');
    return { error: true, status: 404, message: 'Image not found' };
  }
  throw error;
}
```

## Best practices

### 1. Request rate control

```plain text
// Add random delay to reduce ban risk
const delay = Math.random() * 2000 + 1000; // random 1-3s
await new Promise(resolve => setTimeout(resolve, delay));
```

### 2. Header rotation

```plain text
// Rotate among multiple header sets
const headersList: PixivHeaders[] = [
  { /* headers set 1 */ },
  { /* headers set 2 */ },
  { /* headers set 3 */ }
];

let headerIndex = 0;
const currentHeaders = headersList[headerIndex % headersList.length];
headerIndex++;
```

### 3. Retry mechanism

```plain text
async function requestWithRetry(url: string, maxRetries: number = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## Summary

This article, based on a production crawler implementation, summarizes the most useful Pixiv endpoints:

1. **Illustration info**: details, page URLs, recommendations
2. **User-related data**: recommended users and author metadata
3. **Ranking data**: daily / weekly / monthly ranking pages
4. **Homepage recommendation parsing**

When using these APIs:

- Follow website terms of use
- Control request frequency to avoid excessive load
- Handle errors properly
- Use proper headers and authentication context

Hope this reference helps developers working with Pixiv data.

---

_Note: for learning and research only. Please follow applicable laws and platform terms._

![v2-3052331952cbe0c11d5404c6d4b7ff26_r.jpg](/images/posts/pixiv爬虫常用api的文档汇总/image-1.jpg)
