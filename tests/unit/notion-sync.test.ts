import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

import type { PageObjectResponse } from "@notionhq/client";
import matter from "gray-matter";
import { afterEach, describe, expect, it } from "vitest";

import {
  mapNotionArticle,
  serializeNotionArticle,
} from "@/lib/notion-sync/article";
import type { NotionContentSource } from "@/lib/notion-sync/client";
import { parseSyncMode } from "@/lib/notion-sync/config";
import { mapNotionFriend } from "@/lib/notion-sync/friends";
import {
  createFriendAvatarBaseName,
  fetchRemoteImage,
  prepareArticleAssets,
  resolveImageExtension,
} from "@/lib/notion-sync/images";
import { createNotionSlug } from "@/lib/notion-sync/slug";
import { getArticlePath } from "@/lib/notion-sync/store";
import { syncNotionArticles } from "@/lib/notion-sync/sync";

const pageId = "34a4342e-b403-8095-928c-d890fd41b915";
const temporaryDirectories: string[] = [];
const testServers: Server[] = [];

async function startImageServer(
  handler: (
    request: IncomingMessage,
    response: ServerResponse<IncomingMessage>,
  ) => void,
): Promise<string> {
  const server = createServer(handler);
  testServers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

function richText(value: string) {
  return [{ plain_text: value }];
}

function createPage(
  properties: Readonly<Record<string, unknown>>,
): PageObjectResponse {
  return {
    archived: false,
    cover: null,
    created_by: { id: "user" },
    created_time: "2026-07-15T00:00:00.000Z",
    icon: null,
    id: pageId,
    in_trash: false,
    last_edited_by: { id: "user" },
    last_edited_time: "2026-07-16T00:00:00.000Z",
    object: "page",
    parent: { database_id: "database", type: "database_id" },
    properties,
    public_url: null,
    url: "https://notion.so/page",
  } as unknown as PageObjectResponse;
}

function createArticlePage(): PageObjectResponse {
  return createPage({
    Title: {
      id: "title",
      title: richText("AI Agent 深度学习指南"),
      type: "title",
    },
    "Published Date": {
      date: { end: null, start: "2026-07-15", time_zone: null },
      id: "published",
      type: "date",
    },
    Tags: {
      id: "tags",
      multi_select: [{ color: "blue", id: "tag", name: "AI" }],
      type: "multi_select",
    },
    Locale: {
      id: "locale",
      select: { color: "default", id: "locale-zh", name: "zh-CN" },
      type: "select",
    },
  });
}

class FakeNotionSource implements NotionContentSource {
  readonly page = createArticlePage();

  async listApprovedFriends(): Promise<PageObjectResponse[]> {
    return [];
  }

  async listPublishedArticles(): Promise<PageObjectResponse[]> {
    return [this.page];
  }

  async renderArticle(): Promise<string> {
    return "## 可重复同步\n\n同一份内容应得到完全相同的文件。";
  }
}

afterEach(async () => {
  await Promise.all([
    ...temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
    ...testServers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  ]);
});

describe("Notion content mapping", () => {
  it("creates a valid article document with a stable slug", () => {
    const article = mapNotionArticle(
      createArticlePage(),
      "## 正文\n\n这是文章摘要。",
    );
    const document = serializeNotionArticle(article);
    const parsed = matter(document);

    expect(article.slug).toBe("ai-agent-34a4342e");
    expect(article.frontmatter).toMatchObject({
      locale: "zh-CN",
      notionPageId: pageId,
      source: "notion",
      tags: ["AI"],
    });
    expect(parsed.data.published).toBe("2026-07-15");
    expect(parsed.content).toContain("这是文章摘要");
  });

  it("maps the reference friend-link fields", () => {
    const friend = mapNotionFriend(
      createPage({
        网站名称: { id: "name", title: richText("Example"), type: "title" },
        网站地址: { id: "url", type: "url", url: "https://example.org" },
        网站描述: {
          id: "description",
          rich_text: richText("A quiet personal site."),
          type: "rich_text",
        },
        头像URL: {
          id: "avatar",
          type: "url",
          url: "https://example.org/avatar.png",
        },
      }),
    );

    expect(friend).toEqual({
      avatarUrl: "https://example.org/avatar.png",
      description: "A quiet personal site.",
      name: "Example",
      url: "https://example.org",
    });
  });
});

describe("Notion synchronization rules", () => {
  it("is idempotent for identical article data", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "notion-sync-"));
    temporaryDirectories.push(workspace);
    const contentRoot = path.join(workspace, "content", "posts");
    const publicRoot = path.join(workspace, "public");
    const source = new FakeNotionSource();
    const options = {
      contentRoot,
      databaseId: "database",
      mode: "overwrite" as const,
      publicRoot,
      source,
    };

    const first = await syncNotionArticles(options);
    const filePath = getArticlePath(contentRoot, "zh-CN", "ai-agent-34a4342e");
    const firstContent = await readFile(filePath, "utf8");
    const second = await syncNotionArticles(options);

    expect(first).toMatchObject({ created: 1, unchanged: 0 });
    expect(second).toMatchObject({ created: 0, unchanged: 1 });
    expect(await readFile(filePath, "utf8")).toBe(firstContent);
  });

  it("fails before overwriting a manual article", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "notion-sync-"));
    temporaryDirectories.push(workspace);
    const contentRoot = path.join(workspace, "content", "posts");
    const publicRoot = path.join(workspace, "public");
    const destination = getArticlePath(
      contentRoot,
      "zh-CN",
      "ai-agent-34a4342e",
    );
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(
      destination,
      "---\ntitle: Manual\n---\n\nKeep me.\n",
      "utf8",
    );

    await expect(
      syncNotionArticles({
        contentRoot,
        databaseId: "database",
        mode: "overwrite",
        publicRoot,
        source: new FakeNotionSource(),
      }),
    ).rejects.toThrow("collides with manual file");
    expect(await readFile(destination, "utf8")).toContain("Keep me.");
  });
});

describe("Notion sync helpers", () => {
  it("normalizes explicit slugs and validates modes", () => {
    expect(createNotionSlug("Ignored", pageId, "My First Post")).toBe(
      "my-first-post",
    );
    expect(createNotionSlug("Ignored", pageId, "Cloudflare 配置教程")).toBe(
      "cloudflare-配置教程",
    );
    expect(parseSyncMode([])).toBe("overwrite");
    expect(parseSyncMode(["--mode=append"])).toBe("append");
    expect(() => parseSyncMode(["--mode=unsafe"])).toThrow("Invalid Notion");
  });

  it("uses safe deterministic image names", () => {
    expect(
      resolveImageExtension("https://example.org/image", "image/webp"),
    ).toBe("webp");
    expect(
      resolveImageExtension("https://example.org/image.jpeg?x=1", null),
    ).toBe("jpg");
    expect(() =>
      resolveImageExtension("https://example.org/image.png", "text/html"),
    ).toThrow("Unsupported image content type");
    expect(createFriendAvatarBaseName("https://example.org")).toMatch(
      /^friend-[a-f0-9]{12}$/u,
    );
  });

  it("downloads Markdown images to deterministic public paths", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "notion-images-"));
    temporaryDirectories.push(workspace);
    const publicRoot = path.join(workspace, "public");
    const result = await prepareArticleAssets(
      {
        body: "![Diagram](https://cdn.example.org/diagram.png)",
        slug: "image-article",
      },
      publicRoot,
      async () => ({ bytes: new Uint8Array([1, 2, 3]), extension: "png" }),
    );

    expect(result.body).toBe(
      "![Diagram](/images/notion/image-article/image-1.png)",
    );
    expect(
      await readFile(
        path.join(
          publicRoot,
          "images",
          "notion",
          "image-article",
          "image-1.png",
        ),
      ),
    ).toEqual(Buffer.from([1, 2, 3]));
  });

  it("uses the reference HTTP downloader and follows redirects", async () => {
    let userAgent: string | undefined;
    const origin = await startImageServer((request, response) => {
      if (request.url === "/redirect") {
        response.writeHead(302, { location: "/image.png" });
        response.end();
        return;
      }
      userAgent = request.headers["user-agent"];
      response.writeHead(200, { "content-type": "image/png" });
      response.end(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    });

    const image = await fetchRemoteImage(`${origin}/redirect`);

    expect(image.extension).toBe("png");
    expect(image.bytes).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
    expect(userAgent).toBeUndefined();
  });

  it("reports image HTTP failures without exposing signed queries", async () => {
    const origin = await startImageServer((_request, response) => {
      response.writeHead(403);
      response.end();
    });

    const download = fetchRemoteImage(
      `${origin}/image.png?X-Amz-Signature=secret`,
    );

    await expect(download).rejects.toThrow(
      `Image download from ${origin} failed with HTTP 403.`,
    );
    await expect(download).rejects.not.toThrow("secret");
  });

  it("rejects redirects to non-HTTP protocols", async () => {
    const origin = await startImageServer((_request, response) => {
      response.writeHead(302, { location: "file:///tmp/image.png" });
      response.end();
    });

    await expect(fetchRemoteImage(`${origin}/redirect`)).rejects.toThrow(
      `Image redirect from ${origin} must use HTTP or HTTPS.`,
    );
  });
});
