import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  findPublishedBookChapter,
  getBookChapterNavigation,
  getPublishedBookChapters,
} from "@/lib/content/queries";
import { loadBooks } from "@/lib/content/reader";

const temporaryDirectories: string[] = [];

async function createBookRoot() {
  const workspace = await mkdtemp(path.join(tmpdir(), "hero-ui-blog-books-"));
  const root = path.join(workspace, "books");
  const bookDirectory = path.join(root, "zh", "example-book");
  await Promise.all([
    mkdir(bookDirectory, { recursive: true }),
    mkdir(path.join(root, "en"), { recursive: true }),
  ]);
  temporaryDirectories.push(workspace);
  return { bookDirectory, root };
}

function bookSource() {
  return `---
title: Example book
description: A valid book description.
locale: zh-CN
tags: [Guide]
status: complete
order: 1
draft: false
---

## Introduction

Book overview.
`;
}

function chapterSource(title: string, order: number, draft = false) {
  return `---
title: ${title}
order: ${order}
draft: ${draft}
---

## Section

Chapter body.
`;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("book content", () => {
  it("loads, orders and navigates independent chapter files", async () => {
    const { bookDirectory, root } = await createBookRoot();
    await Promise.all([
      writeFile(path.join(bookDirectory, "index.md"), bookSource(), "utf8"),
      writeFile(
        path.join(bookDirectory, "02-second.md"),
        chapterSource("Second", 2),
        "utf8",
      ),
      writeFile(
        path.join(bookDirectory, "01-first.md"),
        chapterSource("First", 1),
        "utf8",
      ),
      writeFile(
        path.join(bookDirectory, "03-draft.md"),
        chapterSource("Draft", 3, true),
        "utf8",
      ),
    ]);

    const books = await loadBooks({ root });
    const book = books[0];
    expect(book).toBeDefined();
    expect(book?.slug).toBe("example-book");
    expect(book?.body).toContain("Book overview");
    expect(book?.chapters).toHaveLength(3);

    const chapters = getPublishedBookChapters(book!);
    expect(chapters.map(({ slug }) => slug)).toEqual(["01-first", "02-second"]);
    const first = findPublishedBookChapter(book!, "01-first");
    expect(first).not.toBeNull();
    expect(getBookChapterNavigation(book!, first!)).toMatchObject({
      next: { slug: "02-second" },
      previous: null,
    });
  });

  it("rejects duplicate chapter ordering", async () => {
    const { bookDirectory, root } = await createBookRoot();
    await Promise.all([
      writeFile(path.join(bookDirectory, "index.md"), bookSource(), "utf8"),
      writeFile(
        path.join(bookDirectory, "01-first.md"),
        chapterSource("First", 1),
        "utf8",
      ),
      writeFile(
        path.join(bookDirectory, "02-second.md"),
        chapterSource("Second", 1),
        "utf8",
      ),
    ]);

    await expect(loadBooks({ root })).rejects.toThrow(
      "duplicate chapter order 1",
    );
  });
});
