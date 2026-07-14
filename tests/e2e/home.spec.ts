import { expect, test } from "@playwright/test";

test("serves the statically exported home page", async ({ page }) => {
  const browserErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    browserErrors.push(error.message);
  });

  await page.goto("/");

  await expect(page).toHaveTitle("HeroUI Blog");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "写下代码之外，仍值得反复想的事。",
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: "阅读文章" }).click();
  await expect(page).toHaveURL(/\/posts\/$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "所有文章" }),
  ).toBeVisible();
  expect(browserErrors).toEqual([]);
});
