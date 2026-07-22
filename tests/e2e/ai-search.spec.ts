import { expect, test } from "@playwright/test";

function successfulStream(answer = "文章介绍了 AutoRAG 的接入过程。") {
  return [
    `event: delta\ndata: ${JSON.stringify({ text: answer })}\n\n`,
    `event: citations\ndata: ${JSON.stringify({
      citations: [
        {
          filename: "cloudflare-ai-search-autorag-ai-2e74342e.mdx",
          href: "/posts/cloudflare-ai-search-autorag-ai-2e74342e/",
          score: 0.93,
          title: "Cloudflare AI Search（AutoRAG）接入实战",
        },
      ],
    })}\n\n`,
    `event: done\ndata: ${JSON.stringify({ requestId: "e2e-request" })}\n\n`,
  ].join("");
}

test.beforeEach(async ({ page }) => {
  await page.route("https://cloud.umami.is/**", async (route) => {
    await route.fulfill({ body: "", contentType: "application/javascript" });
  });
  await page.route(
    "https://static.cloudflareinsights.com/**",
    async (route) => {
      await route.fulfill({ body: "", contentType: "application/javascript" });
    },
  );
  await page.route("https://www.googletagmanager.com/**", async (route) => {
    await route.fulfill({ body: "", contentType: "application/javascript" });
  });
  await page.route(
    "https://pagead2.googlesyndication.com/**",
    async (route) => {
      await route.fulfill({ body: "", contentType: "application/javascript" });
    },
  );
});

test("keeps the AI drawer proportional on desktop and full-width on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ height: 720, width: 1280 });
  await page.goto("/");
  await page.getByRole("button", { name: "打开 AI 搜索" }).click();

  const content = page.locator(".ai-search-content");
  const dialog = page.locator(".ai-search-dialog");
  const form = page.locator(".ai-search-form");
  const textarea = page.getByRole("textbox", { name: "向 AI 搜索提问" });
  const desktopContentBox = await content.boundingBox();
  const desktopDialogBox = await dialog.boundingBox();
  const desktopFormBox = await form.boundingBox();
  const desktopTextareaBox = await textarea.boundingBox();

  expect(desktopContentBox?.width).toBeGreaterThanOrEqual(1279);
  expect(desktopDialogBox?.width).toBeGreaterThanOrEqual(450);
  expect(desktopDialogBox?.width).toBeLessThanOrEqual(461);
  expect(desktopDialogBox?.x).toBeGreaterThan(800);
  expect(desktopFormBox?.width).toBeGreaterThan(400);
  expect(desktopTextareaBox?.width).toBeGreaterThan(330);

  await page.setViewportSize({ height: 844, width: 390 });
  const mobileContentBox = await content.boundingBox();
  const mobileDialogBox = await dialog.boundingBox();
  const mobileFormBox = await form.boundingBox();
  const mobileTextareaBox = await textarea.boundingBox();

  expect(mobileContentBox?.width).toBeGreaterThanOrEqual(389);
  expect(mobileDialogBox?.x).toBe(0);
  expect(mobileDialogBox?.width).toBeGreaterThanOrEqual(389);
  expect(mobileFormBox?.width).toBeGreaterThan(350);
  expect(mobileTextareaBox?.width).toBeGreaterThan(290);
});

test("asks AI search and opens a cited article", async ({ page }) => {
  await page.route("**/api/ai-search", async (route) => {
    await route.fulfill({
      body: successfulStream(),
      contentType: "text/event-stream",
    });
  });
  await page.goto("/");

  await page.getByRole("button", { name: "打开 AI 搜索" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "AI 搜索" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "向 AI 搜索提问" })
    .fill("如何接入 AutoRAG？");
  await page.getByRole("button", { name: "发送问题" }).click();

  await expect(page.getByText("文章介绍了 AutoRAG 的接入过程。")).toBeVisible();
  const citation = page.getByRole("link", {
    name: /Cloudflare AI Search（AutoRAG）接入实战/u,
  });
  await expect(citation).toBeVisible();
  await citation.click();
  await expect(page).toHaveURL(
    /\/posts\/cloudflare-ai-search-autorag-ai-2e74342e\/$/u,
  );
});

test("stops an in-progress AI response", async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input.toString();
      if (!url.includes("/api/ai-search")) return originalFetch(input, init);

      const encoder = new TextEncoder();
      let timer: ReturnType<typeof setTimeout> | undefined;
      const body = new ReadableStream<Uint8Array>({
        cancel() {
          if (timer) clearTimeout(timer);
        },
        start(controller) {
          const abort = () => {
            if (timer) clearTimeout(timer);
            controller.error(new DOMException("Aborted", "AbortError"));
          };
          if (init?.signal?.aborted) {
            abort();
            return;
          }
          init?.signal?.addEventListener("abort", abort, { once: true });
          controller.enqueue(
            encoder.encode('event: delta\ndata: {"text":"正在检索"}\n\n'),
          );
          timer = setTimeout(() => {
            controller.enqueue(
              encoder.encode('event: done\ndata: {"requestId":"late"}\n\n'),
            );
            controller.close();
          }, 5_000);
        },
      });
      return new Response(body, {
        headers: { "Content-Type": "text/event-stream" },
      });
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "打开 AI 搜索" }).click();
  await page.getByRole("textbox", { name: "向 AI 搜索提问" }).fill("测试停止");
  await page.getByRole("button", { name: "发送问题" }).click();

  await expect(page.getByText("正在检索", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "停止生成" }).click();
  await expect(page.getByText("已停止生成", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "向 AI 搜索提问" }),
  ).toBeEnabled();
});

test("retries a failed AI request", async ({ page }) => {
  let requestCount = 0;
  await page.route("**/api/ai-search", async (route) => {
    requestCount += 1;
    if (requestCount === 1) {
      await route.fulfill({
        body: JSON.stringify({
          code: "SERVICE_UNAVAILABLE",
          requestId: "failed",
          retryable: true,
        }),
        contentType: "application/json",
        status: 503,
      });
      return;
    }
    await route.fulfill({
      body: successfulStream("重试成功。"),
      contentType: "text/event-stream",
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "打开 AI 搜索" }).click();
  await page.getByRole("textbox", { name: "向 AI 搜索提问" }).fill("重试测试");
  await page.getByRole("button", { name: "发送问题" }).click();

  await expect(page.locator(".ai-search-error")).toContainText(
    "AI 搜索暂时不可用",
  );
  await page.getByRole("button", { name: "重试" }).click();
  await expect(page.getByText("重试成功。", { exact: true })).toBeVisible();
  expect(requestCount).toBe(2);
});
