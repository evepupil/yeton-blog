import { rm } from "node:fs/promises";
import path from "node:path";

const generatedDirectories = [
  path.join(process.cwd(), ".next", "dev"),
  path.join(process.cwd(), "out"),
];

async function main() {
  await Promise.all(
    generatedDirectories.map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );

  console.log("Stale Next.js development cache and static output cleared.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
