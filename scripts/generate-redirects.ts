import { writeFile } from "node:fs/promises";
import path from "node:path";

import { serializeRedirectFile } from "@/lib/redirects/generator";
import { redirectsConfig } from "@/redirects.config";

const outputPath = path.resolve("public", "_redirects");

async function main() {
  await writeFile(outputPath, serializeRedirectFile(redirectsConfig), "utf8");
  process.stdout.write(
    `Redirects generated: ${redirectsConfig.postSlugs.length} article migrations.\n`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Redirect generation failed: ${message}\n`);
  process.exitCode = 1;
});
