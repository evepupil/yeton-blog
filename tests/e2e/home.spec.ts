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

test("supports the home reading, theme and locale flow", async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);

  await page.goto("/");

  await expect(page).toHaveTitle("林墨手记");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "写下代码之外，仍值得反复想的事。",
    }),
  ).toBeVisible();
  await expect(page.getByText("近期文章", { exact: true })).toBeVisible();

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
      name: "Notes on code, craft, and the questions worth revisiting.",
    }),
  ).toBeVisible();

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

test("opens a real article with contents and adjacent navigation", async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page);
  await page.goto("/");

  await page.getByRole("link", { name: "阅读全文" }).first().click();
  await expect(page).toHaveURL(/\/posts\/cloudflare-pages-nextjs\/$/u);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "把 Next.js 博客稳稳部署到 Cloudflare Pages",
    }),
  ).toBeVisible();

  const contents = page.getByRole("complementary", { name: "本文目录" });
  await contents.getByRole("link", { name: "为什么选 Pages" }).click();
  expect(decodeURIComponent(new URL(page.url()).hash)).toBe("#为什么选-pages");
  await expect(page.locator("#为什么选-pages")).toBeInViewport();

  await page
    .getByRole("navigation", { name: "文章导航" })
    .getByRole("link", { name: "个人博客的搜索，应该搜到什么" })
    .click();
  await expect(page).toHaveURL(/\/posts\/blog-search-design\/$/u);

  await page.getByLabel("选择语言").selectOption("en");
  await expect(page).toHaveURL(/\/en\/posts\/search-notes\/$/u);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Search design for a small personal knowledge base",
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

  await page.goto("/posts/cloudflare-pages-nextjs/");
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
  await page.goto("/en/posts/pages-field-notes/");

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
      name: "Field notes from moving a blog to Cloudflare Pages",
    }),
  ).toBeVisible();
});

test("filters and paginates the article list through the URL", async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page);
  await page.goto("/posts/");

  await expect(page.getByText("共 5 篇")).toBeVisible();
  await expect(page.locator(".post-card")).toHaveCount(4);

  await page.getByRole("button", { name: /前端/u }).click();
  await expect(page).toHaveURL(/\?tag=%E5%89%8D%E7%AB%AF$/u);
  await expect(page.getByText("共 2 篇")).toBeVisible();
  await expect(page.locator(".post-card")).toHaveCount(2);

  await page.getByRole("button", { name: "全部" }).click();
  await page.getByRole("button", { name: "下一页" }).click();
  await expect(page).toHaveURL(/\?page=2$/u);
  await expect(page.locator(".post-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "一周结束时，我只复盘这三个问题",
    }),
  ).toBeVisible();

  await page.reload();
  await expect(page.locator(".post-card")).toHaveCount(1);
  expect(browserErrors).toEqual([]);
});

test("shows archive counts and opens a tag detail page", async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);
  await page.goto("/archives/");

  await expect(page.getByText("共 5 篇文章", { exact: true })).toBeVisible();
  await expect(page.locator(".archive-year")).toHaveCount(2);
  await expect(
    page.getByRole("heading", { level: 2, name: "2026" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "2025" }),
  ).toBeVisible();

  await page
    .locator(".archive-tags")
    .getByRole("link", { name: /前端/u })
    .click();
  await expect(page).toHaveURL(/\/tags\/%E5%89%8D%E7%AB%AF\/$/u);
  await expect(
    page.getByRole("heading", { level: 1, name: "#前端" }),
  ).toBeVisible();
  await expect(page.getByText("这个主题下共有 2 篇文章。")).toBeVisible();
  await expect(page.locator(".post-card")).toHaveCount(2);
  expect(browserErrors).toEqual([]);
});

test("opens a book chapter and switches to its translation", async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page);
  await page.goto("/books/");

  await expect(
    page.getByRole("heading", { level: 1, name: "图书与长文" }),
  ).toBeVisible();
  await expect(page.locator(".book-item")).toHaveCount(2);
  await expect(page.getByRole("progressbar").nth(0)).toHaveAttribute(
    "aria-valuenow",
    "67",
  );
  await expect(page.getByRole("progressbar").nth(1)).toHaveAttribute(
    "aria-valuenow",
    "100",
  );

  await page
    .locator(".book-item")
    .first()
    .getByRole("link", { name: "Prompt 与上下文" })
    .click();
  await expect(page).toHaveURL(
    /\/books\/ai-engineering\/#prompt-%E4%B8%8E%E4%B8%8A%E4%B8%8B%E6%96%87$/u,
  );
  await expect(page.locator("#prompt-与上下文")).toBeInViewport();

  await page.getByLabel("选择语言").selectOption("en");
  await expect(page).toHaveURL(/\/en\/books\/ai-engineering\/$/u);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "An engineering path for AI applications",
    }),
  ).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("returns to the target home when content has no translation", async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page);

  await page.goto("/posts/ai-writing-workflow/");
  await page.getByLabel("选择语言").selectOption("en");
  await expect(page).toHaveURL(/\/en\/$/u);

  await page.goto("/books/indie-builder-notes/");
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
  await searchInput.fill("移动网络");
  await expect(page.getByText("1 条结果", { exact: true })).toBeVisible();
  await page
    .getByRole("link", {
      name: /把 Next\.js 博客稳稳部署到 Cloudflare Pages/u,
    })
    .click();
  await expect(page).toHaveURL(/\/posts\/cloudflare-pages-nextjs\/$/u);

  await page.goto("/en/");
  await page.getByRole("button", { name: "Search writing" }).click();
  await page.getByRole("searchbox", { name: "Search writing" }).fill("search");
  await expect(
    page.getByRole("link", {
      name: /Search design for a small personal knowledge base/u,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("把 Next.js 博客稳稳部署到 Cloudflare Pages"),
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

  await page.goto("/posts/cloudflare-pages-nextjs/");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    "content",
    "article",
  );
  const jsonLd = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  expect(JSON.parse(jsonLd!)).toMatchObject({
    "@type": "BlogPosting",
    dateModified: "2026-07-12",
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
  await page.locator('a[href="/posts/cloudflare-pages-nextjs/"]').click();
  await expect(page).toHaveURL(/\/posts\/cloudflare-pages-nextjs\/$/u);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "把 Next.js 博客稳稳部署到 Cloudflare Pages",
    }),
  ).toBeVisible();

  await context.close();
});
