---
title: "Pixiv Crawler / Downloader / Proxy: One-Click Deployment Without a Server"
description: "I rebuilt last year’s Python Pixiv crawler with AI + serverless architecture. It supports scheduled crawling, downloads, and image proxying."
published: "2025-10-07"
locale: "en"
tags: ["Crawler", "serverless", "pixiv", "Fun"]
draft: false
pinned: false
translationKey: "pixiv爬虫-下载-代理-无需服务器即可一键部署"
---

## Project overview

I rebuilt my Pixiv crawler (originally written in Python last year) using an AI-assisted and serverless architecture. It now supports scheduled tasks, downloads, and proxy access.

### ✨ Core features

- **Serverless architecture**: built on Vercel + Cloudflare Workers with near-zero ops overhead
- **Smart crawling**: supports popularity filtering and automatic quality discovery
- **Image proxy**: solves CORS issues and provides fast image delivery
- **Data storage**: integrated with Supabase, supports complex queries
- **Batch download**: bulk image download to Cloudflare R2
- ⏰ **Scheduled jobs**: auto-crawl rankings with no manual intervention

### ️ System architecture

```plain text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel API    │    │ Cloudflare Cron │    │   Supabase DB   │
│ (Main Service)  │◄──►│ (Scheduled Jobs)│◄──►│  (Data Storage) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Image Proxy    │    │ Crawl Scheduler │    │ Data Analytics  │
│ (CORS Solution) │    │(Task Dispatch)  │    │      API        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core implementation

### 1. Smart crawler engine

This crawler does more than fetch basic metadata; it also estimates content popularity:

```plain text
/**
 * Pixiv crawler core class
 * Supports recommendation and popularity scoring
 */
export class PixivCrawler {
  private headers: any;
  private logManager: any;
  private taskId: string;

  constructor(pid: string, headers: any, logManager: any, taskId: string) {
    this.headers = headers;
    this.logManager = logManager;
    this.taskId = taskId;
  }

  /**
   * Fetch illustration detail and compute popularity
   * @param pid Illustration ID
   * @returns Illustration info + popularity score
   */
  async getIllustDetail(pid: string) {
    try {
      const url = `https://www.pixiv.net/ajax/illust/${pid}`;
      const response = await fetch(url, { headers: this.headers });
      const data = await response.json();

      if (data.error) {
        throw new Error(`API error: ${data.message}`);
      }

      const illust = data.body;

      // Popularity scoring
      const popularity = this.calculatePopularity(
        illust.likeCount,
        illust.bookmarkCount,
        illust.viewCount
      );

      return {
        pid: illust.id,
        title: illust.title,
        tags: illust.tags.tags.map((tag: any) => tag.tag),
        likeCount: illust.likeCount,
        bookmarkCount: illust.bookmarkCount,
        viewCount: illust.viewCount,
        popularity,
        createDate: illust.createDate
      };
    } catch (error) {
      this.logManager.addLog(`Failed to fetch illustration ${pid}: ${error.message}`, 'error', this.taskId);
      throw error;
    }
  }

  /**
   * Popularity formula based on likes, bookmarks, and views
   */
  private calculatePopularity(likes: number, bookmarks: number, views: number): number {
    if (views === 0) return 0;

    const likeRate = likes / views;
    const bookmarkRate = bookmarks / views;

    // Weighted popularity
    return (likeRate * 0.3 + bookmarkRate * 0.7) * Math.log10(views + 1);
  }
}
```

### 2. Image proxy service

Solve CORS and serve images with fallback size strategy:

```plain text
/**
 * Pixiv image proxy service
 * Supports multi-size fallback and graceful downgrade
 */
export class PixivProxy {
  private headers: any;

  constructor() {
    this.headers = {
      'Referer': 'https://www.pixiv.net/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
  }

  /**
   * Proxy image from Pixiv
   * @param pid Illustration ID
   * @param size Preferred size
   * @returns Image stream
   */
  async proxyImage(pid: string, size: string = 'regular') {
    // Size priority: thumb_mini -> small -> regular -> original
    const sizeOptions = ['thumb_mini', 'small', 'regular', 'original'];
    const startIndex = sizeOptions.indexOf(size);

    if (startIndex === -1) {
      throw new Error(`Unsupported size: ${size}`);
    }

    // Try each size by priority
    for (let i = startIndex; i < sizeOptions.length; i++) {
      try {
        const currentSize = sizeOptions[i];
        const imageUrl = await this.getImageUrl(pid, currentSize);

        if (imageUrl) {
          const imageResponse = await fetch(imageUrl, {
            headers: this.headers
          });

          if (imageResponse.ok) {
            return {
              data: imageResponse.body,
              contentType: imageResponse.headers.get('content-type'),
              size: currentSize
            };
          }
        }
      } catch (error) {
        console.log(`Failed at size ${sizeOptions[i]}, trying next size`);
        continue;
      }
    }

    throw new Error(`No available image size found for ${pid}`);
  }

  /**
   * Get image URL for a specific size
   */
  private async getImageUrl(pid: string, size: string): Promise<string | null> {
    try {
      const response = await fetch(`https://www.pixiv.net/ajax/illust/${pid}`, {
        headers: this.headers
      });

      const data = await response.json();
      const urls = data.body?.urls;

      return urls?.[size] || null;
    } catch (error) {
      return null;
    }
  }
}
```

### 3. API design

A full RESTful API for crawling, proxying, stats, and UI:

```plain text
/**
 * Main API handler
 * Supports crawl / download / proxy / stats
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action, pid, size } = req.query;

  try {
    switch (action) {
      case 'proxy-image':
        // Proxy image endpoint
        if (!pid) {
          res.status(400).json({ error: 'Missing pid parameter' });
          return;
        }

        const proxy = new PixivProxy();
        const imageResult = await proxy.proxyImage(pid as string, size as string);

        res.setHeader('Content-Type', imageResult.contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 1 day

        return imageResult.data.pipe(res);

      case 'get-pic':
        // Get illustration data
        const crawler = new PixivCrawler(pid as string, getPixivHeaders(), logManager, 'api_request');
        const illustInfo = await crawler.getIllustDetail(pid as string);

        res.status(200).json({
          success: true,
          data: illustInfo
        });
        break;

      case 'stats':
        // Get aggregated stats
        const supabase = new SupabaseService();
        const stats = await supabase.getStats();

        res.status(200).json({
          success: true,
          stats
        });
        break;

      default:
        // Return web UI
        const htmlContent = getWebInterface();
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(htmlContent);
    }
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
```

### 4. Scheduled crawling

Automated cron jobs with Cloudflare Workers:

```plain text
/**
 * Cloudflare Cron Worker
 * Executes scheduled crawl jobs
 */
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log('Scheduled task started:', new Date().toISOString());

    try {
      // Daily ranking crawl
      if (shouldRunDailyRanking(event.cron)) {
        await triggerRankingCrawl('daily', env);
      }

      // Weekly ranking crawl
      if (shouldRunWeeklyRanking(event.cron)) {
        await triggerRankingCrawl('weekly', env);
      }

      // Cleanup expired logs
      if (shouldCleanLogs(event.cron)) {
        await cleanExpiredLogs(env);
      }

    } catch (error) {
      console.error('Scheduled task failed:', error);
    }
  }
};

/**
 * Trigger ranking crawl
 */
async function triggerRankingCrawl(type: 'daily' | 'weekly' | 'monthly', env: Env) {
  const endpoint = `${env.MAIN_SERVICE_URL}/api/?action=${type}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.API_TOKEN}`
      }
    });

    if (response.ok) {
      console.log(`${type} ranking crawl triggered`);
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Failed to trigger ${type} ranking crawl:`, error);
  }
}
```

### 3-minute quick deployment

### Step 1: Clone the project

```plain text
git clone https://github.com/your-username/serverless_pixiv_crawler.git
cd serverless_pixiv_crawler
npm install
```

### Step 2: Configure env vars

Copy `.env.example` to `.env`:

```plain text
# Supabase config
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Pixiv config
PIXIV_COOKIE=your_pixiv_cookie_here

# Cloudflare R2 config (optional)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_BUCKET_NAME=your_bucket_name
```

### Step 3: Deploy to Vercel

```plain text
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

### Step 4: Deploy cron worker (optional)

```plain text
cd cron_worker
npm install

# Configure Cloudflare Workers
npx wrangler login
npx wrangler deploy
```

### Feature demo

### 1. Web admin dashboard

After deployment, open your Vercel domain and you will see a modern admin dashboard:

- **Real-time stats**: crawl count, success rate, and more
- **Task management**: start, stop, and monitor jobs
- **Log viewer**: real-time runtime logs
- **Data search**: quickly filter and locate crawled content

### 2. API examples

```plain text
// Get illustration info
fetch('https://your-domain.vercel.app/api/?action=get-pic&pid=123456')
  .then(res => res.json())
  .then(data => console.log(data));

// Proxy image access
const imageUrl = 'https://your-domain.vercel.app/api/?action=proxy-image&pid=123456&size=regular';
document.getElementById('image').src = imageUrl;

// Start crawl task
fetch('https://your-domain.vercel.app/api/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pid: '123456',
    targetNum: 1000,
    popularityThreshold: 0.22
  })
});
```

### 3. Data analytics

The system automatically collects and analyzes data:

```plain text
-- Top tags
SELECT tag, COUNT(*) as count
FROM illustrations
CROSS JOIN LATERAL unnest(tags) as tag
GROUP BY tag
ORDER BY count DESC
LIMIT 20;

-- Popularity distribution
SELECT
  CASE
    WHEN popularity >= 0.8 THEN 'Very High'
    WHEN popularity >= 0.5 THEN 'High'
    WHEN popularity >= 0.2 THEN 'Medium'
    ELSE 'Low'
  END as level,
  COUNT(*) as count
FROM illustrations
GROUP BY level;
```

### Advanced capabilities

### 1. Smart recommendation

Built-in recommendation logic provides:

- **Content discovery**: find similar high-quality works from existing data
- **Trend prediction**: estimate future popularity trends
- **Style analysis**: classify visual styles automatically

### 2. Anti-ban strategy

- **Header rotation**: mimic real browser behavior
- ⏱️ **Adaptive delay**: dynamic request intervals
- ️ **Retry logic**: resilient handling of transient errors

### 3. Data quality assurance

- ✅ **Automatic deduplication**
- **Content validation**
- **Quality scoring** per item

### Cost analysis

The biggest advantage: **it can run fully on free tiers**.

| Service            | Free quota      | Enough for                  |
| ------------------ | --------------- | --------------------------- |
| Vercel             | 100GB/month     | Small to medium projects    |
| Supabase           | 500MB DB        | ~500,000 records            |
| Cloudflare Workers | 100,000 req/day | Most use cases              |
| Cloudflare R2      | 10GB storage    | Tens of thousands of images |

### Troubleshooting

### Common problems

1. **Deployment fails**
2. Check environment variable settings
3. Verify Supabase connectivity
4. **Crawl fails**
5. Verify Pixiv cookie validity
6. Check network status
7. **Images not loading**
8. Confirm proxy service is running
9. Check CORS configuration

### Performance optimization tips

- **Enable caching**: tune CDN cache policies
- **Monitor metrics**: track performance regularly
- **Clean up regularly**: remove expired logs and stale data

### Summary

This serverless Pixiv crawler demonstrates what modern web architecture can deliver:

- ✅ **Zero ops cost**: fully managed cloud services
- ✅ **Elastic scalability**: handles traffic spikes automatically
- ✅ **Complete workflow**: crawl, store, analyze, and serve in one system
- ✅ **Easy deployment**: launch in about 3 minutes

Whether you want to learn serverless architecture or need a practical data-collection tool, this project is a great starting point.

### Related resources

- [Project source code](https://github.com/evepupil/serverless_pixiv_crawler)
- [Detailed docs](https://github.com/evepupil/serverless_pixiv_crawler/tree/master/docs)
- [Issue tracker](https://github.com/evepupil/serverless_pixiv_crawler/issues)
- [Live demo](https://pixiv.chaosyn.com/)

---

**Disclaimer**: this project is for learning and research only. Please follow target-site terms of service and control crawl frequency responsibly.

**If this article helped you, please give the project a ⭐ Star!**

![v2-a211000410c25bbc31bbac49312d1020_1440w.png](/images/posts/pixiv爬虫-下载-代理-无需服务器即可一键部署/image-1.png)
