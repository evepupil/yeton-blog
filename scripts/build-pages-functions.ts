import { spawnSync } from "node:child_process";
import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve("out");
const temporaryDirectory = path.join(outputDirectory, ".worker-build");
const workerOutputPath = path.join(outputDirectory, "_worker.js");

async function buildPagesFunctions() {
  await rm(temporaryDirectory, { force: true, recursive: true });
  await rm(workerOutputPath, { force: true, recursive: true });
  await mkdir(temporaryDirectory, { recursive: true });

  const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const result = spawnSync(
    pnpm,
    [
      "exec",
      "wrangler",
      "pages",
      "functions",
      "build",
      "functions",
      "--outdir",
      temporaryDirectory,
      "--minify",
    ],
    {
      shell: process.platform === "win32",
      stdio: "inherit",
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `Pages Function build failed with exit code ${result.status}.`,
    );
  }

  await copyFile(path.join(temporaryDirectory, "index.js"), workerOutputPath);
  await rm(temporaryDirectory, { force: true, recursive: true });
  console.log("Pages Function compiled to out/_worker.js.");
}

buildPagesFunctions().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
