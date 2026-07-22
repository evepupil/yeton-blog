import path from "node:path";

import {
  localizedNotFoundPages,
  prepareLocalizedNotFoundPages,
} from "@/lib/deployment/localized-not-found";

async function main(): Promise<void> {
  await prepareLocalizedNotFoundPages(path.resolve("out"));
  console.log(
    `Prepared ${localizedNotFoundPages.length} localized Pages 404 file(s).`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
