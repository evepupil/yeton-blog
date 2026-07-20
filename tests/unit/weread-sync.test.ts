import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchAnnualReadingStats,
  WEREAD_GATEWAY_URL,
  WEREAD_SKILL_VERSION,
} from "@/lib/weread/client";
import { syncWereadStatus } from "@/lib/weread/sync";
import {
  createReadingStatus,
  parseFinishedBookCount,
  selectRecentPublicBooks,
} from "@/lib/weread/transform";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

async function createWorkspace(): Promise<string> {
  const workspace = await mkdtemp(path.join(tmpdir(), "weread-sync-"));
  temporaryDirectories.push(workspace);
  return workspace;
}

function gatewayFetcher(options?: { readonly coverStatus?: number }) {
  return vi.fn<typeof fetch>(async (input, init) => {
    if (String(input) !== WEREAD_GATEWAY_URL) {
      return new Response("cover", {
        headers: { "content-type": "image/jpeg" },
        status: options?.coverStatus ?? 200,
      });
    }

    const request = JSON.parse(String(init?.body)) as { api_name: string };
    if (request.api_name === "/readdata/detail") {
      return Response.json({
        errcode: 0,
        readDays: 42,
        readStat: [{ counts: "12本", stat: "读完" }],
        totalReadTime: 7_230,
      });
    }
    return Response.json({
      books: [
        {
          author: "作者",
          cover: "https://cdn.example/cover.jpg",
          finishReading: 0,
          readUpdateTime: 100,
          secret: 0,
          title: "公开书籍",
        },
      ],
      errcode: 0,
    });
  });
}

describe("WeRead data mapping", () => {
  it("maps annual seconds, active days and finished book counts", () => {
    const result = createReadingStatus(
      {
        readDays: 38,
        readStat: [{ counts: "1,234本", stat: "读完" }],
        totalReadTime: 7_239,
      },
      [],
      new Date("2026-07-20T09:00:00.000Z"),
    );

    expect(result).toMatchObject({
      activeDays: 38,
      finishedBooks: 1234,
      totalMinutes: 120,
      updatedAt: "2026-07-20T09:00:00.000Z",
    });
    expect(
      parseFinishedBookCount([{ counts: "9天", stat: "读过" }]),
    ).toBeNull();
  });

  it("filters private and unread books, then sorts and limits recent books", () => {
    const books = Array.from({ length: 5 }, (_, index) => ({
      author: `Author ${index}`,
      cover: `https://cdn.example/${index}.jpg`,
      finishReading: index === 3 ? 1 : 0,
      readUpdateTime: index + 1,
      secret: index === 4 ? 1 : 0,
      title: `Book ${index}`,
    }));
    books.push({
      author: "Unread",
      cover: "",
      finishReading: 0,
      readUpdateTime: 0,
      secret: 0,
      title: "Unread",
    });

    expect(selectRecentPublicBooks(books)).toEqual([
      {
        author: "Author 3",
        coverUrl: "https://cdn.example/3.jpg",
        state: "finished",
        title: "Book 3",
      },
      {
        author: "Author 2",
        coverUrl: "https://cdn.example/2.jpg",
        state: "reading",
        title: "Book 2",
      },
      {
        author: "Author 1",
        coverUrl: "https://cdn.example/1.jpg",
        state: "reading",
        title: "Book 1",
      },
    ]);
  });
});

describe("WeRead gateway", () => {
  it("sends the official versioned annual request", async () => {
    const fetcher = gatewayFetcher();
    await fetchAnnualReadingStats({ apiKey: "wrk-test", fetcher });

    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(String(url)).toBe(WEREAD_GATEWAY_URL);
    expect(init?.headers).toMatchObject({ Authorization: "Bearer wrk-test" });
    expect(JSON.parse(String(init?.body))).toEqual({
      api_name: "/readdata/detail",
      baseTime: 0,
      mode: "annually",
      skill_version: WEREAD_SKILL_VERSION,
    });
  });

  it("rejects provider errors and mandatory upgrades", async () => {
    await expect(
      fetchAnnualReadingStats({
        apiKey: "wrk-test",
        fetcher: async () =>
          Response.json({ errcode: 1001, errmsg: "Key 已失效" }),
      }),
    ).rejects.toThrow(/1001.*Key 已失效/u);

    await expect(
      fetchAnnualReadingStats({
        apiKey: "wrk-test",
        fetcher: async () =>
          Response.json({
            errcode: 0,
            upgrade_info: { message: "请升级到新版本" },
          }),
      }),
    ).rejects.toThrow("请升级到新版本");
  });
});

describe("WeRead synchronization", () => {
  it("skips cleanly without a key and never touches files", async () => {
    const workspace = await createWorkspace();
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      syncWereadStatus({ apiKey: "  ", fetcher, workspaceRoot: workspace }),
    ).resolves.toEqual({ status: "skipped" });
    expect(fetcher).not.toHaveBeenCalled();
    await expect(readdir(workspace)).resolves.toEqual([]);
  });

  it("keeps the previous snapshot when the provider fails", async () => {
    const workspace = await createWorkspace();
    const dataPath = path.join(workspace, "data", "reading-status.json");
    const imageDirectory = path.join(workspace, "public", "images", "reading");
    const oldStatus =
      '{"activeDays":1,"books":[],"finishedBooks":1,"totalMinutes":1,"updatedAt":null}\n';
    await mkdir(imageDirectory, { recursive: true });
    await mkdir(path.dirname(dataPath), { recursive: true });
    await writeFile(dataPath, oldStatus, "utf8");
    await writeFile(path.join(imageDirectory, "old.jpg"), "old", "utf8");

    await expect(
      syncWereadStatus({
        apiKey: "wrk-test",
        fetcher: async () => new Response("unavailable", { status: 503 }),
        workspaceRoot: workspace,
      }),
    ).rejects.toThrow(/HTTP 503/u);
    expect(await readFile(dataPath, "utf8")).toBe(oldStatus);
    expect(await readFile(path.join(imageDirectory, "old.jpg"), "utf8")).toBe(
      "old",
    );
  });

  it("uses an empty cover when its download fails and completes the sync", async () => {
    const workspace = await createWorkspace();
    const warnings: string[] = [];
    const result = await syncWereadStatus({
      apiKey: "wrk-test",
      fetcher: gatewayFetcher({ coverStatus: 403 }),
      logger: {
        info: () => undefined,
        warn: (message) => warnings.push(message),
      },
      now: () => new Date("2026-07-20T10:00:00.000Z"),
      workspaceRoot: workspace,
    });
    const data = JSON.parse(
      await readFile(
        path.join(workspace, "data", "reading-status.json"),
        "utf8",
      ),
    ) as {
      books: Array<{
        author: string;
        cover: string;
        state: string;
        title: string;
      }>;
    };

    expect(result).toEqual({ bookCount: 1, status: "updated" });
    expect(data.books).toEqual([
      {
        author: "作者",
        cover: "",
        state: "reading",
        title: "公开书籍",
      },
    ]);
    expect(warnings).toEqual([
      "[微信读书] 《公开书籍》封面下载失败，将使用页面占位图。",
    ]);
    await expect(
      readdir(path.join(workspace, "public", "images", "reading")),
    ).resolves.toEqual([]);
  });
});
