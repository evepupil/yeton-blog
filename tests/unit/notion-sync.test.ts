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
  prepareFriendAvatars,
  resolveImageExtension,
} from "@/lib/notion-sync/images";
import { rewriteInternalPostLinks } from "@/lib/notion-sync/links";
import type { SyncReporter } from "@/lib/notion-sync/reporter";
import { createNotionSlug } from "@/lib/notion-sync/slug";
import { getArticlePath } from "@/lib/notion-sync/store";
import { syncNotionArticles } from "@/lib/notion-sync/sync";

const pageId = "34a4342e-b403-8095-928c-d890fd41b915";
const temporaryDirectories: string[] = [];
const testServers: Server[] = [];

function createMemoryReporter(): {
  readonly info: string[];
  readonly reporter: SyncReporter;
  readonly warnings: string[];
} {
  const info: string[] = [];
  const warnings: string[] = [];
  return {
    info,
    reporter: {
      info(message) {
        info.push(message);
      },
      warn(message) {
        warnings.push(message);
      },
    },
    warnings,
  };
}

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

function createArticlePage(
  title = "AI Agent 深度学习指南",
): PageObjectResponse {
  return createPage({
    Title: {
      id: "title",
      title: richText(title),
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
  constructor(readonly page = createArticlePage()) {}

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
  it("creates a valid article document with a stable slug", async () => {
    const article = mapNotionArticle(
      createArticlePage(),
      "## 正文\n\n这是文章摘要。",
    );
    const document = await serializeNotionArticle(article);
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
    const logs = createMemoryReporter();
    const options = {
      contentRoot,
      databaseId: "database",
      mode: "overwrite" as const,
      publicRoot,
      reporter: logs.reporter,
      source,
    };

    const first = await syncNotionArticles(options);
    const filePath = getArticlePath(contentRoot, "zh-CN", "ai-agent-34a4342e");
    const firstContent = await readFile(filePath, "utf8");
    const second = await syncNotionArticles(options);

    expect(first).toMatchObject({ created: 1, unchanged: 0 });
    expect(second).toMatchObject({ created: 0, unchanged: 1 });
    expect(await readFile(filePath, "utf8")).toBe(firstContent);
    expect(logs.info).toContain("📥 从 Notion 获取已发布文章...");
    expect(logs.info).toContain("📝 处理文章: AI Agent 深度学习指南");
    expect(logs.info).toContain("  ✅ 内容无变化: ai-agent-34a4342e.mdx");
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

  it("keeps an existing Notion slug when the title changes", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "notion-sync-"));
    temporaryDirectories.push(workspace);
    const contentRoot = path.join(workspace, "content", "posts");
    const publicRoot = path.join(workspace, "public");
    const baseOptions = {
      contentRoot,
      databaseId: "database",
      mode: "overwrite" as const,
      publicRoot,
    };

    await syncNotionArticles({
      ...baseOptions,
      source: new FakeNotionSource(),
    });
    const originalPath = getArticlePath(
      contentRoot,
      "zh-CN",
      "ai-agent-34a4342e",
    );
    await writeFile(
      originalPath,
      (await readFile(originalPath, "utf8")).replace(
        'source: "notion"',
        'translationKey: "agent-guide"\nsource: "notion"',
      ),
      "utf8",
    );
    const renamedSource = new FakeNotionSource(
      createArticlePage("Renamed Agent Guide"),
    );
    const result = await syncNotionArticles({
      ...baseOptions,
      source: renamedSource,
    });

    expect(result).toMatchObject({ created: 0, deleted: 0, updated: 1 });
    expect(await readFile(originalPath, "utf8")).toContain(
      'title: "Renamed Agent Guide"',
    );
    expect(await readFile(originalPath, "utf8")).toContain(
      'translationKey: "agent-guide"',
    );
    await expect(
      readFile(
        getArticlePath(contentRoot, "zh-CN", "renamed-agent-guide-34a4342e"),
        "utf8",
      ),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });
});

describe("Notion sync helpers", () => {
  it("rewrites legacy internal post links to canonical slugs", () => {
    const markdown = [
      "[反向代理](https://blog.chaosyn.com/posts/cloudflare-worker%E5%8F%8D%E5%90%91%E4%BB%A3%E7%90%86%E7%BD%91%E7%AB%99%E6%95%99%E7%A8%8B/)",
      "[优选节点](/posts/cloud-flare配置优选节点教程/?from=notion#setup)",
      "[外站](https://example.org/posts/cloudflare-worker反向代理网站教程/)",
      "`https://blog.chaosyn.com/posts/cloudflare-worker反向代理网站教程/`",
    ].join("\n\n");

    expect(rewriteInternalPostLinks(markdown)).toBe(
      [
        "[反向代理](/posts/cloudflare-worker-2ad4342e/)",
        "[优选节点](/posts/cloud-flare-2b34342e/?from=notion#setup)",
        "[外站](https://example.org/posts/cloudflare-worker反向代理网站教程/)",
        "`https://blog.chaosyn.com/posts/cloudflare-worker反向代理网站教程/`",
      ].join("\n\n"),
    );
  });

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

  it("keeps syncing when a remote article image returns 403", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "notion-images-"));
    temporaryDirectories.push(workspace);
    const logs = createMemoryReporter();
    const remoteImage = "https://pic-out.zhimg.com/example.png";

    const result = await prepareArticleAssets(
      {
        body: `![Zhihu image](${remoteImage})`,
        coverUrl: "https://pic-out.zhimg.com/cover.png",
        slug: "zhihu-article",
      },
      path.join(workspace, "public"),
      async () => {
        throw new Error(
          "Image download from https://pic-out.zhimg.com failed with HTTP 403.",
        );
      },
      logs.reporter,
    );

    expect(result).toEqual({ body: `![Zhihu image](${remoteImage})` });
    expect(logs.info).toContain("  🖼️  发现 1 张图片需要下载");
    expect(logs.warnings).toContain(
      "  ⚠️  下载失败: https://pic-out.zhimg.com",
    );
    expect(logs.warnings).toContain(
      "  ⚠️  封面图下载失败: https://pic-out.zhimg.com",
    );
  });

  it("keeps friend links when an avatar download fails", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "notion-friends-"));
    temporaryDirectories.push(workspace);
    const logs = createMemoryReporter();

    const friends = await prepareFriendAvatars(
      [
        {
          avatarUrl: "https://example.org/avatar.png",
          description: "Friend",
          name: "Example",
          url: "https://example.org",
        },
      ],
      path.join(workspace, "public"),
      async () => {
        throw new Error("HTTP 403");
      },
      logs.reporter,
    );

    expect(friends).toEqual([
      {
        description: "Friend",
        name: "Example",
        url: "https://example.org",
      },
    ]);
    expect(logs.warnings).toContain("  ⚠️  头像下载失败: Example");
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
