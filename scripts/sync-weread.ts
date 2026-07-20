import { config } from "dotenv";

import { syncWereadStatus } from "@/lib/weread/sync";

if (!process.env.CI) {
  config({ path: ".env.local", quiet: true });
}

async function main(): Promise<void> {
  console.log("\n微信读书状态同步\n");
  const result = await syncWereadStatus({
    apiKey: process.env.WEREAD_API_KEY,
  });
  if (result.status === "updated") {
    console.log(`同步完成：已公开 ${result.bookCount} 本最近阅读书籍。`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`微信读书同步失败：${message}`);
  process.exitCode = 1;
});
