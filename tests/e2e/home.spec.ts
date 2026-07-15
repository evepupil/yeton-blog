import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

function collectBrowserErrors(page: Page) {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return errors;
}

test.beforeEach(async ({ page }) => {
  await page.route("https://cloud.umami.is/**", async (route) => {
    await route.fulfill({
      body: "",
      contentType: "application/javascript",
    });
  });
});

test("supports the home reading, theme and locale flow", async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);
  const analyticsScript = page.waitForRequest(
    "https://cloud.umami.is/script.js",
  );

  await page.goto("/");
  await analyticsScript;

  await expect(page).toHaveTitle("潮思Chaosyn");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "技术探索与思维进化",
    }),
  ).toBeVisible();
  await expect(page.getByText("近期文章", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/evepupil",
  );
  await expect(
    page.getByRole("link", { name: "统计" }).first(),
  ).toHaveAttribute("href", "https://cloud.umami.is/share/VOIhBeLJ4qp3otfX");
  await expect(
    page.locator(
      'script[data-website-id="526149f7-e7d5-40ac-ae75-50a0c2515abf"]',
    ),
  ).toHaveCount(1);

  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", /^(dark|light)$/u);
  const initialTheme = await html.getAttribute("data-theme");
  await page.getByRole("button", { name: "切换主题" }).click();
  await expect(html).toHaveAttribute(
    "data-theme",
    initialTheme === "dark" ? "light" : "dark",
  );

  await page.getByLabel("选择语言").selectOption("en");
  await expect(page).toHaveURL(/\/en\/$/u);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Exploring technology and evolving ideas",
    }),
  ).toBeVisible();
  await expect(
    page.locator(".profile-socials").getByRole("link", { name: "RSS" }),
  ).toHaveAttribute("href", "/en/rss.xml");

  await page.getByRole("link", { name: "Read writing" }).click();
  await expect(page).toHaveURL(/\/en\/posts\/$/u);
  await expect(
    page.getByRole("heading", { level: 1, name: "All writing" }),
  ).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("opens and closes the mobile navigation", async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: "打开菜单" });
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  const mobileNavigation = page.locator("#mobile-navigation");
  const archiveLink = mobileNavigation.getByRole("link", {
    name: "归档",
    exact: true,
  });
  await expect(archiveLink).toBeVisible();
  await archiveLink.click();
  await expect(page).toHaveURL(/\/archives\/$/u);
  await expect(
    page.getByRole("heading", { level: 1, name: "文章归档" }),
  ).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("opens recent writing from whole home cards while keeping read labels", async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page);
  await page.goto("/");

  const primaryLink = page.locator(".featured-primary-link");
  await expect(primaryLink).toHaveCount(1);
  await expect(primaryLink.locator(".featured-media")).toHaveCount(0);
  await expect(primaryLink.locator(".article-link")).toHaveText("阅读全文");
  await expect(primaryLink.locator("a")).toHaveCount(0);
  await expect(
    page.locator(".featured-secondary .featured-card-link"),
  ).toHaveCount(2);
  const href = await primaryLink.getAttribute("href");

  await primaryLink.click({ position: { x: 12, y: 12 } });
  await page.waitForURL((url) => decodeURIComponent(url.pathname) === href);
  expect(browserErrors).toEqual([]);
});

test("opens a migrated article with contents, navigation and translation", async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page);
  await page.goto(
    "/posts/nextdevtpl-一个面向独立开发者的-next-js-全栈-saas-模板/",
  );
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "NextDevTpl：一个面向独立开发者的 Next.js 全栈 SaaS 模板",
    }),
  ).toBeVisible();

  const contents = page.getByRole("complementary", { name: "本文目录" });
  await contents.getByRole("link", { name: "为什么做这个模板？" }).click();
  expect(decodeURIComponent(new URL(page.url()).hash)).toBe(
    "#为什么做这个模板",
  );
  await expect(page.locator("#为什么做这个模板")).toBeInViewport();

  await page
    .getByRole("navigation", { name: "文章导航" })
    .getByRole("link", {
      name: "Cloudflare AI Gateway 自定义供应商配置与踩坑记录",
    })
    .click();
  await expect(page).toHaveURL(
    /\/posts\/cloudflare-ai-gateway-%E8%87%AA%E5%AE%9A%E4%B9%89%E4%BE%9B%E5%BA%94%E5%95%86%E9%85%8D%E7%BD%AE%E4%B8%8E%E8%B8%A9%E5%9D%91%E8%AE%B0%E5%BD%95\/$/u,
  );

  await page.getByLabel("选择语言").selectOption("en");
  await expect(page).toHaveURL(
    /\/en\/posts\/cloudflare-ai-gateway-custom-provider-setup-and-pitfalls\/$/u,
  );
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Cloudflare AI Gateway: Custom Provider Setup and Pitfalls",
    }),
  ).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("loads comments on demand and follows the site theme", async ({
  page,
}) => {
  await page.route("https://giscus.app/client.js", async (route) => {
    await route.fulfill({
      body: `
        const frame = document.createElement("iframe");
        frame.className = "giscus-frame";
        frame.src = "https://giscus.app/test-frame";
        document.currentScript.parentElement.append(frame);
      `,
      contentType: "application/javascript",
    });
  });
  await page.route("https://giscus.app/test-frame", async (route) => {
    await route.fulfill({
      body: `
        <!doctype html>
        <html><body><script>
          window.addEventListener("message", (event) => {
            const theme = event.data?.giscus?.setConfig?.theme;
            if (theme) document.body.dataset.theme = theme;
          });
        <\/script></body></html>
      `,
      contentType: "text/html",
    });
  });

  await page.goto(
    "/posts/nextdevtpl-一个面向独立开发者的-next-js-全栈-saas-模板/",
  );
  const comments = page.getByTestId("article-comments");
  await expect(
    comments.getByRole("heading", { level: 2, name: "评论" }),
  ).toBeVisible();
  await comments.getByRole("button", { name: "加载评论" }).click();
  const commentsFrame = page.frameLocator("iframe.giscus-frame");
  const frameBody = commentsFrame.locator("body");
  const html = page.locator("html");
  const initialTheme = await html.getAttribute("data-theme");
  await expect(frameBody).toHaveAttribute("data-theme", initialTheme!);

  await page.getByRole("button", { name: "切换主题" }).click();
  const nextTheme = initialTheme === "dark" ? "light" : "dark";
  await expect(html).toHaveAttribute("data-theme", nextTheme);
  await expect(frameBody).toHaveAttribute("data-theme", nextTheme);
});

test("keeps the article readable when comments fail to load", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("https://giscus.app/client.js", async (route) => {
    await route.abort("failed");
  });
  await page.goto(
    "/en/posts/nextdevtpl-next-js-fullstack-saas-template-for-indie-developers/",
  );

  const comments = page.getByTestId("article-comments");
  await comments.getByRole("button", { name: "Load comments" }).click();
  await expect(
    comments.getByText(
      "Comments could not load. The article remains available.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    comments.getByRole("button", { name: "Try again" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "NextDevTpl: A Next.js Full-Stack SaaS Template for Indie Developers",
    }),
  ).toBeVisible();
});

test("filters and paginates the article list through the URL", async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page);
  await page.goto("/posts/");

  await expect(page.getByText("共 19 篇")).toBeVisible();
  await expect(page.locator(".post-card")).toHaveCount(4);

  await page.getByRole("button", { name: /^AI/u }).click();
  await expect(page).toHaveURL(/\?tag=AI$/u);
  await expect(page.getByText("共 5 篇")).toBeVisible();
  await expect(page.locator(".post-card")).toHaveCount(4);

  await page.getByRole("button", { name: "下一页" }).click();
  await expect(page).toHaveURL(/\?tag=AI&page=2$/u);
  await expect(page.locator(".post-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Cloudflare AI Search（AutoRAG）接入实战，个人博客的知识库AI助手",
    }),
  ).toBeVisible();

  await page.reload();
  await expect(page.locator(".post-card")).toHaveCount(1);
  expect(browserErrors).toEqual([]);
});

test("uses compact whole-card article links with optional covers", async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page);
  await page.goto("/posts/");

  const firstCard = page.locator(".post-card").first();
  const firstLink = firstCard.locator(".post-card-link");
  await expect(firstLink).toHaveCount(1);
  await expect(firstCard.locator(".post-card-media")).toHaveCount(0);
  await expect(firstLink.locator("a")).toHaveCount(0);
  await expect(firstCard.locator(".article-link")).toHaveCount(0);
  await expect(firstCard.locator(".post-card-tags")).toBeVisible();
  const firstHref = await firstLink.getAttribute("href");
  const firstHeight = (await firstCard.boundingBox())?.height;
  expect(firstHeight).toBeLessThanOrEqual(220);

  const descriptionClamp = await firstCard
    .locator(".post-card-body > p")
    .evaluate((element) => getComputedStyle(element).webkitLineClamp);
  expect(descriptionClamp).toBe("2");
  const verticalPadding = await firstCard
    .locator(".post-card-body")
    .evaluate((element) => {
      const meta = element.querySelector(".article-meta");
      const tags = element.querySelector(".post-card-tags");
      if (!meta || !tags) {
        return null;
      }
      const bodyRect = element.getBoundingClientRect();
      const metaRect = meta.getBoundingClientRect();
      const tagsRect = tags.getBoundingClientRect();
      return {
        bottom: bodyRect.bottom - tagsRect.bottom,
        top: metaRect.top - bodyRect.top,
      };
    });
  expect(verticalPadding).not.toBeNull();
  expect(
    Math.abs(verticalPadding!.top - verticalPadding!.bottom),
  ).toBeLessThanOrEqual(1);

  const longCard = page
    .locator(".post-card")
    .filter({ hasText: "Cloudflare Worker 反代网站为什么有的网站能用" });
  await expect(longCard.locator(".post-card-tags")).toBeVisible();
  expect(
    await longCard
      .locator(".post-card-body")
      .evaluate((element) => element.scrollHeight <= element.clientHeight),
  ).toBe(true);

  await firstLink.click({ position: { x: 8, y: 8 } });
  await page.waitForURL(
    (url) => decodeURIComponent(url.pathname) === firstHref,
  );

  await page.goto("/posts/?page=4");
  const coveredCard = page
    .locator(".post-card:has(.post-card-frame.has-media)")
    .first();
  await expect(coveredCard.locator(".post-card-media img")).toHaveCount(1);
  const mediaRatio = await coveredCard
    .locator(".post-card-media")
    .evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.width / bounds.height;
    });
  expect(mediaRatio).toBeGreaterThan(1.5);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/posts/");
  const mobileCard = page.locator(".post-card").first();
  expect((await mobileCard.boundingBox())?.height).toBeLessThanOrEqual(200);
  await expect(mobileCard.locator(".article-link")).toHaveCount(0);
  await expect(mobileCard.locator(".post-card-tags")).toBeVisible();
  await expect(
    mobileCard.locator('.post-card-tags [data-slot="chip"]').first(),
  ).toBeVisible();
  const mobileLayout = await mobileCard.evaluate((element) => {
    const frame = element.querySelector(".post-card-frame");
    const body = element.querySelector(".post-card-body");
    const meta = element.querySelector(".article-meta");
    const tags = element.querySelector(".post-card-tags");
    if (!frame || !body || !meta || !tags) {
      return null;
    }
    const frameRect = frame.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();
    const metaRect = meta.getBoundingClientRect();
    const tagsRect = tags.getBoundingClientRect();
    return {
      bottomPadding: bodyRect.bottom - tagsRect.bottom,
      metaLines: Math.round(
        metaRect.height / parseFloat(getComputedStyle(meta).lineHeight),
      ),
      tagsInsideFrame:
        tagsRect.top >= frameRect.top && tagsRect.bottom <= frameRect.bottom,
      topPadding: metaRect.top - bodyRect.top,
    };
  });
  expect(mobileLayout).not.toBeNull();
  expect(mobileLayout!.metaLines).toBe(1);
  expect(mobileLayout!.tagsInsideFrame).toBe(true);
  expect(
    Math.abs(mobileLayout!.topPadding - mobileLayout!.bottomPadding),
  ).toBeLessThanOrEqual(1);
  expect(browserErrors).toEqual([]);
});

test("shows archive counts and opens a tag detail page", async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);
  await page.goto("/archives/");

  await expect(page.getByText("共 19 篇文章", { exact: true })).toBeVisible();
  await expect(page.locator(".archive-year")).toHaveCount(2);
  await expect(
    page.getByRole("heading", { level: 2, name: "2026" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "2025" }),
  ).toBeVisible();

  await page
    .locator(".archive-tags")
    .getByRole("link", { name: /^AI/u })
    .click();
  await expect(page).toHaveURL(/\/tags\/AI\/$/u);
  await expect(
    page.getByRole("heading", { level: 1, name: "#AI" }),
  ).toBeVisible();
  await expect(page.getByText("这个主题下共有 5 篇文章。")).toBeVisible();
  await expect(page.locator(".post-card")).toHaveCount(5);
  expect(browserErrors).toEqual([]);
});

test("opens a migrated book chapter and falls back across languages", async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page);
  await page.goto("/books/");

  await expect(
    page.getByRole("heading", { level: 1, name: "图书与长文" }),
  ).toBeVisible();
  await expect(page.locator(".book-item")).toHaveCount(3);
  await expect(page.getByRole("progressbar").nth(0)).toHaveAttribute(
    "aria-valuenow",
    "100",
  );
  await expect(page.getByRole("progressbar").nth(1)).toHaveAttribute(
    "aria-valuenow",
    "100",
  );

  await page
    .locator(".book-item")
    .first()
    .getByRole("link", { name: "Prompt：把需求表达清楚" })
    .click();
  await expect(page).toHaveURL(
    /\/books\/ai-engineering\/#prompt%E6%8A%8A%E9%9C%80%E6%B1%82%E8%A1%A8%E8%BE%BE%E6%B8%85%E6%A5%9A$/u,
  );
  await expect(page.locator("#prompt把需求表达清楚")).toBeInViewport();

  await page.getByLabel("选择语言").selectOption("en");
  await expect(page).toHaveURL(/\/en\/$/u);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Exploring technology and evolving ideas",
    }),
  ).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("returns to the target home when content has no translation", async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page);

  await page.goto("/posts/从-prompt-到-subagent-ai-工程化学习路线/");
  await page.getByLabel("选择语言").selectOption("en");
  await expect(page).toHaveURL(/\/en\/$/u);

  await page.goto("/books/tae-kim-japanese-grammar-guide/");
  await page.getByLabel("选择语言").selectOption("en");
  await expect(page).toHaveURL(/\/en\/$/u);
  expect(browserErrors).toEqual([]);
});

test("searches the current language index and opens a result", async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page);
  await page.goto("/");

  await page.getByRole("button", { name: "搜索文章" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "搜索文章" }),
  ).toBeVisible();
  await expect(page.getByText("最近发布", { exact: true })).toBeVisible();

  const searchInput = page.getByRole("searchbox", { name: "搜索文章" });
  await searchInput.fill("神经元");
  await expect(page.getByText("1 条结果", { exact: true })).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("link", {
      name: /Cloudflare Workers AI 免费额度值多少钱/u,
    })
    .click();
  await expect(page).toHaveURL(
    /\/posts\/cloudflare-workers-ai-%E5%85%8D%E8%B4%B9%E9%A2%9D%E5%BA%A6%E5%80%BC%E5%A4%9A%E5%B0%91%E9%92%B1\/$/u,
  );

  await page.goto("/en/");
  await page.getByRole("button", { name: "Search writing" }).click();
  await page
    .getByRole("searchbox", { name: "Search writing" })
    .fill("custom provider");
  await expect(
    page.getByRole("dialog").getByRole("link", {
      name: /Cloudflare AI Gateway: Custom Provider Setup and Pitfalls/u,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Cloudflare Workers AI 免费额度值多少钱？"),
  ).toHaveCount(0);
  expect(browserErrors).toEqual([]);
});

test("serves localized metadata and the custom not-found page", async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page);

  await page.goto("/en/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const englishCanonical = await page
    .locator('link[rel="canonical"]')
    .getAttribute("href");
  expect(new URL(englishCanonical!).pathname).toBe("/en/");
  await expect(
    page.locator('link[rel="alternate"][hreflang="zh-CN"]'),
  ).toHaveAttribute("href", /\/$/u);

  await page.goto("/posts/ai-agent-深度学习指南/");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    "content",
    "article",
  );
  const jsonLd = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  expect(JSON.parse(jsonLd!)).toMatchObject({
    "@type": "BlogPosting",
    dateModified: "2026-02-24",
    inLanguage: "zh-CN",
  });
  expect(browserErrors).toEqual([]);

  const notFoundResponse = await page.goto("/missing-page/");
  expect(notFoundResponse?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(
    page.getByRole("heading", { level: 1, name: "这里还没有内容。" }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/u,
  );

  await page.goto("/en/404/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { level: 1, name: "This page is missing." }),
  ).toBeVisible();
  expect(
    browserErrors.filter(
      (message) =>
        !message.includes(
          "Failed to load resource: the server responded with a status of 404",
        ),
    ),
  ).toEqual([]);
});

test("keeps the core reading path available without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("/");
  await page
    .locator('a[href="/posts/从-prompt-到-subagent-ai-工程化学习路线/"]')
    .first()
    .click();
  await expect(page).toHaveURL(
    /\/posts\/%E4%BB%8E-prompt-%E5%88%B0-subagent-ai-%E5%B7%A5%E7%A8%8B%E5%8C%96%E5%AD%A6%E4%B9%A0%E8%B7%AF%E7%BA%BF\/$/u,
  );
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "从 Prompt 到 Subagent：AI 工程化学习路线",
    }),
  ).toBeVisible();

  await context.close();
});
