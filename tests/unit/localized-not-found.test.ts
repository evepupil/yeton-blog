import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { prepareLocalizedNotFoundPages } from "../../lib/deployment/localized-not-found";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("localized Pages 404 output", () => {
  it("copies the exported English page to the nearest 404 path", async () => {
    const outputDirectory = await mkdtemp(
      path.join(os.tmpdir(), "yeton-blog-pages-"),
    );
    temporaryDirectories.push(outputDirectory);
    const sourceDirectory = path.join(outputDirectory, "en", "404");
    await mkdir(sourceDirectory, { recursive: true });
    await writeFile(
      path.join(sourceDirectory, "index.html"),
      '<html lang="en">English 404</html>',
      "utf8",
    );

    await prepareLocalizedNotFoundPages(outputDirectory);

    await expect(
      readFile(path.join(outputDirectory, "en", "404.html"), "utf8"),
    ).resolves.toBe('<html lang="en">English 404</html>');
  });
});
