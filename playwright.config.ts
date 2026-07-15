import { defineConfig, devices } from "@playwright/test";

const port = 44_173;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.CI ? {} : { channel: "chrome" }),
      },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm exec serve out --listen ${port} --no-clipboard --no-port-switching`,
    env: {
      NEXT_PUBLIC_GISCUS_REPO: "example/blog",
      NEXT_PUBLIC_GISCUS_REPO_ID: "R_test",
      NEXT_PUBLIC_GISCUS_CATEGORY: "General",
      NEXT_PUBLIC_GISCUS_CATEGORY_ID: "DIC_test",
    },
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
