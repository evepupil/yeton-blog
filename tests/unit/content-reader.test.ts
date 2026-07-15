import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { loadArticles } from "@/lib/content/reader";

const temporaryDirectories: string[] = [];

async function createContentRoot() {
  const workspace = await mkdtemp(path.join(tmpdir(), "hero-ui-blog-content-"));
  const root = path.join(workspace, "posts");
  const publicRoot = path.join(workspace, "public");
  await Promise.all([
    mkdir(path.join(root, "zh"), { recursive: true }),
    mkdir(path.join(root, "en"), { recursive: true }),
    mkdir(publicRoot, { recursive: true }),
  ]);
  temporaryDirectories.push(workspace);
  return { publicRoot, root };
}

function articleSource(overrides: string = "") {
  return `---
title: "Test article"
description: "A valid description."
published: "2026-07-14"
locale: "zh-CN"
tags:
  - "Test"
${overrides}---

## Heading

Body text.
`;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("loadArticles", () => {
  it("loads an empty content root", async () => {
    const { publicRoot, root } = await createContentRoot();

    await expect(loadArticles({ root, publicRoot })).resolves.toEqual([]);
  });

  it("loads one valid article with derived content data", async () => {
    const { publicRoot, root } = await createContentRoot();
    await writeFile(
      path.join(root, "zh", "first-post.mdx"),
      articleSource(),
      "utf8",
    );

    const articles = await loadArticles({ root, publicRoot });

    expect(articles).toHaveLength(1);
    expect(articles[0]).toMatchObject({
      headings: [{ depth: 2, id: "heading", text: "Heading" }],
      locale: "zh-CN",
      readTime: 1,
      slug: "first-post",
    });
  });

  it("preserves a lowercase Unicode slug for legacy URLs", async () => {
    const { publicRoot, root } = await createContentRoot();
    await writeFile(
      path.join(root, "zh", "cloudflare-配置教程.mdx"),
      articleSource(),
      "utf8",
    );

    const articles = await loadArticles({ root, publicRoot });

    expect(articles[0]?.slug).toBe("cloudflare-配置教程");
  });

  it("rejects invalid dates with the source file in the error", async () => {
    const { publicRoot, root } = await createContentRoot();
    await writeFile(
      path.join(root, "zh", "invalid-date.mdx"),
      articleSource('updated: "2026-07-01"\n'),
      "utf8",
    );

    await expect(loadArticles({ root, publicRoot })).rejects.toThrow(
      /invalid-date\.mdx: updated: updated cannot be earlier/u,
    );
  });

  it("rejects missing local images", async () => {
    const { publicRoot, root } = await createContentRoot();
    await writeFile(
      path.join(root, "zh", "missing-image.mdx"),
      articleSource('image: "/images/missing.jpg"\n'),
      "utf8",
    );

    await expect(loadArticles({ root, publicRoot })).rejects.toThrow(
      "image does not exist: /images/missing.jpg",
    );
  });

  it("rejects translation keys that do not connect two locales", async () => {
    const { publicRoot, root } = await createContentRoot();
    await writeFile(
      path.join(root, "zh", "unpaired.mdx"),
      articleSource('translationKey: "unpaired"\n'),
      "utf8",
    );

    await expect(loadArticles({ root, publicRoot })).rejects.toThrow(
      "translationKey must connect at least two locales",
    );
  });

  it("rejects duplicate slugs inside one locale", async () => {
    const { publicRoot, root } = await createContentRoot();
    const firstDirectory = path.join(root, "zh", "first");
    const secondDirectory = path.join(root, "zh", "second");
    await Promise.all([
      mkdir(firstDirectory, { recursive: true }),
      mkdir(secondDirectory, { recursive: true }),
    ]);
    await Promise.all([
      writeFile(
        path.join(firstDirectory, "same-slug.mdx"),
        articleSource(),
        "utf8",
      ),
      writeFile(
        path.join(secondDirectory, "same-slug.mdx"),
        articleSource(),
        "utf8",
      ),
    ]);

    await expect(loadArticles({ root, publicRoot })).rejects.toThrow(
      "duplicate article slug same-slug for zh-CN",
    );
  });

  it("rejects content stored in the wrong locale directory", async () => {
    const { publicRoot, root } = await createContentRoot();
    await writeFile(
      path.join(root, "en", "wrong-locale.mdx"),
      articleSource(),
      "utf8",
    );

    await expect(loadArticles({ root, publicRoot })).rejects.toThrow(
      "locale zh-CN must be stored under zh/",
    );
  });
});
