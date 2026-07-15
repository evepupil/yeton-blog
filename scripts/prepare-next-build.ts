import { rm } from "node:fs/promises";
import path from "node:path";

const nextDevDirectory = path.join(process.cwd(), ".next", "dev");

async function main() {
  await rm(nextDevDirectory, { force: true, recursive: true });

  console.log("Next.js development cache cleared for production build.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
