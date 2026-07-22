import { copyFile } from "node:fs/promises";
import path from "node:path";

export interface LocalizedNotFoundPage {
  readonly source: string;
  readonly target: string;
}

export const localizedNotFoundPages: readonly LocalizedNotFoundPage[] = [
  {
    source: "en/404/index.html",
    target: "en/404.html",
  },
];

export async function prepareLocalizedNotFoundPages(
  outputDirectory: string,
): Promise<void> {
  await Promise.all(
    localizedNotFoundPages.map(({ source, target }) =>
      copyFile(
        path.join(outputDirectory, source),
        path.join(outputDirectory, target),
      ),
    ),
  );
}
