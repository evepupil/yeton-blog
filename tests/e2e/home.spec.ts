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

async function switchLocale(
  page: Page,
  triggerLabel: string,
  optionLabel: string,
) {
  const trigger = page.getByRole("button", { name: triggerLabel });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await page.getByRole("option", { name: optionLabel, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.route("https://cloud.umami.is/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/api/share/")) {
      await route.fulfill({
        body: JSON.stringify({
          token: "test-umami-share-token-1234567890",
          websiteId: "526149f7-e7d5-40ac-ae75-50a0c2515abf",
        }),
        contentType: "application/json",
      });
      return;
    }
    if (url.pathname.endsWith("/stats")) {
      const isLegacyPath = (url.searchParams.get("path") ?? "").includes(
        "nextdevtpl-一个面向独立开发者的-next-js-全栈-saas-模板",
      );
      await route.fulfill({
        body: JSON.stringify({
          pageviews: isLegacyPath ? 59 : 3,
          visitors: isLegacyPath ? 27 : 2,
          visits: isLegacyPath ? 28 : 2,
        }),
        contentType: "application/json",
      });
      return;
    }
    await route.fulfill({
      body: 'document.documentElement.dataset.umamiScriptExecuted = "true";',
      contentType: "application/javascript",
    });
  });
  await page.route("https://www.googletagmanager.com/**", async (route) => {
    await route.fulfill({
      body: 'document.documentElement.dataset.googleAnalyticsScriptExecuted = "true";',
      contentType: "application/javascript",
    });
  });
  await page.route(
    "https://static.cloudflareinsights.com/**",
    async (route) => {
      await route.fulfill({
        body: 'document.documentElement.dataset.cloudflareWebAnalyticsScriptExecuted = "true";',
        contentType: "application/javascript",
      });
    },
  );
  await page.route(
    "https://pagead2.googlesyndication.com/**",
    async (route) => {
      await route.fulfill({
        body: `
          window.adsbygoogle = window.adsbygoogle || [];
          document.documentElement.dataset.adsenseScriptExecuted = "true";
        `,
        contentType: "application/javascript",
      });
    },
  );
});

test("supports the home reading, theme and locale flow", async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);
  const analyticsScript = page.waitForRequest(
    "https://cloud.umami.is/script.js",
  );
  const googleAnalyticsScript = page.waitForRequest(
    "https://www.googletagmanager.com/gtag/js?id=G-D9ZRKT7G85",
  );
  const cloudflareWebAnalyticsScript = page.waitForRequest(
    "https://static.cloudflareinsights.com/beacon.min.js",
  );
  const adsenseScript = page.waitForRequest(
    /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/u,
  );

  await page.goto("/");
  await Promise.all([
    analyticsScript,
    cloudflareWebAnalyticsScript,
    googleAnalyticsScript,
    adsenseScript,
  ]);

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
  await expect(page.locator("#blog-umami-script")).not.toHaveAttribute("inert");
  await expect(page.locator("#blog-umami-script")).toHaveAttribute("async", "");
  await expect(page.locator("#blog-umami-script")).toHaveAttribute(
    "data-load-status",
    "loaded",
  );
  await expect(
    page.locator('meta[name="google-adsense-account"]'),
  ).toHaveAttribute("content", "ca-pub-1149581082118045");
  await expect(
    page.locator('meta[name="google-analytics-id"]'),
  ).toHaveAttribute("content", "G-D9ZRKT7G85");
  await expect(
    page.locator(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
    ),
  ).toHaveCount(1);
  await expect(page.locator("#blog-adsense-script")).not.toHaveAttribute(
    "inert",
  );
  await expect(page.locator("#blog-adsense-script")).toHaveAttribute(
    "data-load-status",
    "loaded",
  );
  await expect(
    page.locator('script[src*="googletagmanager.com/gtag/js?id=G-D9ZRKT7G85"]'),
  ).toHaveCount(1);
  await expect(
    page.locator("#blog-google-analytics-script"),
  ).not.toHaveAttribute("inert");
  await expect(page.locator("#blog-google-analytics-script")).toHaveAttribute(
    "data-load-status",
    "loaded",
  );
  await expect(
    page.locator("#blog-cloudflare-web-analytics-script"),
  ).toHaveAttribute(
    "data-cf-beacon",
    '{"token":"34ff13ae70884f10a32cf231fb228bfe"}',
  );
  await expect(
    page.locator("#blog-cloudflare-web-analytics-script"),
  ).not.toHaveAttribute("inert");
  await expect(
    page.locator("#blog-cloudflare-web-analytics-script"),
  ).toHaveAttribute("data-load-status", "loaded");

  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-umami-script-executed", "true");
  await expect(html).toHaveAttribute(
    "data-google-analytics-script-executed",
    "true",
  );
  await expect(html).toHaveAttribute("data-adsense-script-executed", "true");
  await expect(html).toHaveAttribute(
    "data-cloudflare-web-analytics-script-executed",
    "true",
  );
  await expect(html).toHaveAttribute("data-theme", /^(dark|light)$/u);
  const initialTheme = await html.getAttribute("data-theme");
  await page.getByRole("button", { name: "切换主题" }).click();
  await expect(html).toHaveAttribute(
    "data-theme",
    initialTheme === "dark" ? "light" : "dark",
  );

  const searchAlignment = await page
    .getByRole("button", { name: "搜索文章" })
    .evaluate((button) => {
      const icon = button.querySelector("svg");
      if (!icon) return null;
      const buttonRect = button.getBoundingClientRect();
      const iconRect = icon.getBoundingClientRect();
      return {
        x:
          iconRect.left +
          iconRect.width / 2 -
          (buttonRect.left + buttonRect.width / 2),
        y:
          iconRect.top +
          iconRect.height / 2 -
          (buttonRect.top + buttonRect.height / 2),
      };
    });
  expect(searchAlignment).not.toBeNull();
  expect(Math.abs(searchAlignment!.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(searchAlignment!.y)).toBeLessThanOrEqual(1);

  const localeTrigger = page.getByRole("button", { name: "选择语言" });
  await expect(localeTrigger.locator("svg")).toHaveCount(1);
  await expect(localeTrigger.locator('[data-slot="select-value"]')).toHaveCount(
    0,
  );
  await expect(
    localeTrigger.locator('[data-slot="select-default-indicator"]'),
  ).toHaveCount(0);
  await switchLocale(page, "选择语言", "English");
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

test("shows the data-driven about page in both languages", async ({ page }) => {
  const browserErrors = collectBrowserErrors(page);
  const days = Array.from({ length: 35 }, (_, index) => ({
    count: index % 5,
    date: new Date(Date.UTC(2026, 5, 16 + index)).toISOString().slice(0, 10),
    level: (index % 5) as 0 | 1 | 2 | 3 | 4,
  }));

  await page.route("**/api/about-status", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        generatedAt: "2026-07-20T08:00:00.000Z",
        github: {
          activeDays: 28,
          days,
          totalContributions: 70,
          username: "evepupil",
        },
        tokenBoard: {
          monthTokens: 128_600_000,
          sourceSplit: [
            { source: "claude", totalTokens: 80_000_000 },
            { source: "codex", totalTokens: 48_600_000 },
          ],
          todayTokens: 2_400_000,
          topModels: [
            { model: "claude-sonnet", totalTokens: 60_000_000 },
            { model: "gpt-5", totalTokens: 42_000_000 },
          ],
          totalTokens: 900_000_000,
        },
      }),
      contentType: "application/json",
    });
  });

  await page.goto("/about/");
  await expect(
    page.getByRole("heading", { level: 1, name: "关于叶桐" }),
  ).toBeVisible();
  await expect(page.getByText("128.6M", { exact: true })).toBeVisible();
  await expect(page.locator(".about-heatmap-cell")).toHaveCount(35);
  await expect(
    page.getByRole("heading", {
      level: 3,
      name: "等待首次微信读书同步",
    }),
  ).toBeVisible();
  await expect(page.getByText("TypeScript", { exact: true })).toBeVisible();
  await expect(page.getByText("Multi-agent", { exact: true })).toBeVisible();
  await expect(page.locator(".focus-band")).toHaveCount(0);

  await page.setViewportSize({ height: 844, width: 390 });
  await page.reload();
  await expect(page.locator(".about-heatmap-cell").last()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.goto("/en/about/");
  await expect(
    page.getByRole("heading", { level: 1, name: "About Yeton" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "The last 365 days" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Technology radar" }),
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

test("shows synchronized friend links with an avatar fallback", async ({
  page,
}) => {
  await page.route(
    "**/images/friends/friend-f8545507dba1.webp",
    async (route) => {
      await route.abort("failed");
    },
  );
  await page.goto("/links/");

  await expect(
    page.getByRole("heading", { level: 1, name: "友链" }),
  ).toBeVisible();
  await expect(page.getByText("1 个站点", { exact: true })).toBeVisible();
  const friendLink = page.getByRole("link", { name: "访问 Betsy Blog" });
  await expect(friendLink).toHaveAttribute("href", "https://www.micostar.cc");
  await expect(friendLink).toHaveAttribute("target", "_blank");
  await expect(page.locator(".friend-avatar-fallback")).toHaveText("B");

  await switchLocale(page, "选择语言", "English");
  await expect(page).toHaveURL(/\/en\/links\/$/u);
  await expect(
    page.getByRole("heading", { level: 1, name: "Friends" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Visit Betsy Blog" }),
  ).toBeVisible();
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
  await page.route("https://giscus.app/client.js", async (route) => {
    await route.fulfill({ body: "", contentType: "application/javascript" });
  });
  await page.goto("/posts/nextdevtpl-next-js-saas-30b4342e/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "NextDevTpl：一个面向独立开发者的 Next.js 全栈 SaaS 模板",
    }),
  ).toBeVisible();
  await expect(page.getByTestId("article-view-stats")).toContainText(
    "浏览 62 · 访客 29",
  );

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
  await expect(page).toHaveURL(/\/posts\/cloudflare-ai-gateway-3024342e\/$/u);

  await switchLocale(page, "选择语言", "English");
  await expect(page).toHaveURL(
    /\/en\/posts\/cloudflare-ai-gateway-custom-provider-setup-and-pitfalls\/$/u,
  );
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Cloudflare AI Gateway: Custom Provider Setup and Pitfalls",
    }),
  ).toBeVisible();

  const articleLayout = await page.evaluate(() => {
    const title = document.querySelector(".article-header h1");
    const description = document.querySelector(".article-header > p");
    const body = document.querySelector(".article-layout > article");
    const prose = document.querySelector(".article-prose");
    if (!title || !body || !prose) return null;
    const titleRect = title.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();
    return {
      bodyX: bodyRect.x,
      descriptionExists: Boolean(description),
      fontSize: getComputedStyle(prose).fontSize,
      titleWidth: titleRect.width,
      titleX: titleRect.x,
    };
  });
  expect(articleLayout).not.toBeNull();
  expect(articleLayout!.descriptionExists).toBe(false);
  expect(articleLayout!.fontSize).toBe("17px");
  expect(articleLayout!.titleWidth).toBeGreaterThan(1100);
  expect(
    Math.abs(articleLayout!.titleX - articleLayout!.bodyX),
  ).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileArticleLayout = await page.evaluate(() => {
    const title = document.querySelector(".article-header h1");
    const body = document.querySelector(".article-layout > article");
    const prose = document.querySelector(".article-prose");
    if (!title || !body || !prose) return null;
    return {
      bodyX: body.getBoundingClientRect().x,
      fontSize: getComputedStyle(prose).fontSize,
      hasOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      titleX: title.getBoundingClientRect().x,
    };
  });
  expect(mobileArticleLayout).not.toBeNull();
  expect(mobileArticleLayout!.fontSize).toBe("16px");
  expect(mobileArticleLayout!.hasOverflow).toBe(false);
  expect(
    Math.abs(mobileArticleLayout!.titleX - mobileArticleLayout!.bodyX),
  ).toBeLessThanOrEqual(1);
  expect(browserErrors).toEqual([]);
});

test("keeps articles readable when Umami statistics are unavailable", async ({
  page,
}) => {
  await page.route(
    /cloud\.umami\.is\/analytics\/us\/api\/websites\/.*\/stats/u,
    async (route) => {
      await route.abort("failed");
    },
  );
  await page.goto("/posts/nextdevtpl-next-js-saas-30b4342e/");

  await expect(page.getByTestId("article-view-stats")).toContainText(
    "统计暂不可用",
  );
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "NextDevTpl：一个面向独立开发者的 Next.js 全栈 SaaS 模板",
    }),
  ).toBeVisible();
  await expect(page.locator(".article-prose")).not.toBeEmpty();
});

test("loads comments near the viewport and follows the site theme", async ({
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

  await page.goto("/posts/nextdevtpl-next-js-saas-30b4342e/");
  const comments = page.getByTestId("article-comments");
  await expect(
    comments.getByRole("heading", { level: 2, name: "评论" }),
  ).toBeVisible();
  await expect(comments.getByRole("button", { name: "加载评论" })).toHaveCount(
    0,
  );
  await comments.scrollIntoViewIfNeeded();
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
  await comments.scrollIntoViewIfNeeded();
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

test("shows the sponsorship entry before comments", async ({ page }) => {
  await page.route("https://giscus.app/client.js", async (route) => {
    await route.abort("failed");
  });
  await page.goto("/posts/nextdevtpl-next-js-saas-30b4342e/");

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          ((window as Window & { adsbygoogle?: unknown[] }).adsbygoogle ?? [])
            .length,
      ),
    )
    .toBeGreaterThan(0);

  const sponsorship = page.getByTestId("article-sponsorship");
  await sponsorship.scrollIntoViewIfNeeded();
  await expect(
    sponsorship.getByRole("heading", { level: 2, name: "喜欢这篇文章？" }),
  ).toBeVisible();
  await sponsorship.getByRole("button", { name: "微信赞赏" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "微信赞赏" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "叶桐的微信收款二维码" }),
  ).toBeVisible();

  const sponsorshipBox = await sponsorship.boundingBox();
  const commentsBox = await page.getByTestId("article-comments").boundingBox();
  expect(sponsorshipBox).not.toBeNull();
  expect(commentsBox).not.toBeNull();
  expect(sponsorshipBox!.y).toBeLessThan(commentsBox!.y);
});

test("filters and paginates the article list through the URL", async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page);
  await page.goto("/posts/");

  await expect(page.getByText("共 19 篇")).toBeVisible();
  await expect(page.locator(".post-card")).toHaveCount(10);

  await page.getByRole("button", { name: /^AI/u }).click();
  await expect(page).toHaveURL(/\?tag=AI$/u);
  await expect(page.getByText("共 5 篇")).toBeVisible();
  await expect(page.locator(".post-card")).toHaveCount(5);
  await expect(page.getByRole("button", { name: "下一页" })).toHaveCount(0);

  await page.getByRole("button", { name: "全部" }).click();
  await expect(page).toHaveURL(/\/posts\/$/u);
  await expect(page.locator(".post-card")).toHaveCount(10);

  await page.getByRole("button", { name: "下一页" }).click();
  await expect(page).toHaveURL(/\?page=2$/u);
  await expect(page.locator(".post-card")).toHaveCount(9);

  await page.reload();
  await expect(page.locator(".post-card")).toHaveCount(9);
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

test("uses fixed book cards and reads one migrated chapter at a time", async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page);
  await page.goto("/books/");

  await expect(
    page.getByRole("heading", { level: 1, name: "图书与长文" }),
  ).toBeVisible();
  await expect(page.locator(".book-item")).toHaveCount(3);
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await expect(
    page.locator(".book-item").first().locator(".book-chapters-preview a"),
  ).toHaveCount(2);

  const desktopHeights = await page
    .locator(".book-item")
    .evaluateAll((items) =>
      items.map((item) => item.getBoundingClientRect().height),
    );
  expect(new Set(desktopHeights).size).toBe(1);

  await page
    .locator(".book-item")
    .first()
    .getByRole("link", { name: "Prompt：把需求表达清楚" })
    .click();
  await expect(page).toHaveURL(/\/books\/ai-engineering\/01-prompt\/$/u);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Prompt：把需求表达清楚",
    }),
  ).toBeVisible();
  await expect(page.locator(".book-chapter-sidebar nav a")).toHaveCount(12);
  await expect(
    page.locator('.book-chapter-sidebar nav a[aria-current="page"]'),
  ).toHaveText(/Prompt：把需求表达清楚/u);
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Structured Output：让 AI 输出可被程序处理的结果",
    }),
  ).toHaveCount(0);

  await page.locator(".book-chapter-nav-link.is-next").click();
  await expect(page).toHaveURL(
    /\/books\/ai-engineering\/02-structured-output\/$/u,
  );
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Structured Output：让 AI 输出可被程序处理的结果",
    }),
  ).toBeVisible();

  await switchLocale(page, "选择语言", "English");
  await expect(page).toHaveURL(/\/en\/$/u);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Exploring technology and evolving ideas",
    }),
  ).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/books/");
  const mobileHeights = await page
    .locator(".book-item")
    .evaluateAll((items) =>
      items.map((item) => item.getBoundingClientRect().height),
    );
  expect(new Set(mobileHeights).size).toBe(1);
  await expect(page.locator(".book-chapters-preview")).toHaveCount(3);
  await expect(page.locator(".book-chapters-preview").first()).toBeHidden();

  await page.goto("/books/ai-engineering/01-prompt/");
  await expect(page.locator(".book-chapter-sidebar")).toBeHidden();
  await expect(page.locator(".book-mobile-directory")).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("returns to the target home when content has no translation", async ({
  page,
}) => {
  const browserErrors = collectBrowserErrors(page);

  await page.goto("/posts/prompt-subagent-ai-36c4342e/");
  await switchLocale(page, "选择语言", "English");
  await expect(page).toHaveURL(/\/en\/$/u);

  await page.goto("/books/tae-kim-japanese-grammar-guide/");
  await switchLocale(page, "选择语言", "English");
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
  await expect(page).toHaveURL(/\/posts\/cloudflare-workers-ai-3594342e\/$/u);

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

  await page.goto("/posts/ai-agent-3114342e/");
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
    .locator('a[href="/posts/prompt-subagent-ai-36c4342e/"]')
    .first()
    .click();
  await expect(page).toHaveURL(/\/posts\/prompt-subagent-ai-36c4342e\/$/u);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "从 Prompt 到 Subagent：AI 工程化学习路线",
    }),
  ).toBeVisible();

  await context.close();
});
