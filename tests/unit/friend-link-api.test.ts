import { afterEach, describe, expect, it, vi } from "vitest";

import {
  onRequestPost,
  type FriendLinkApplicationEnv,
} from "@/functions/api/submit-friend-link";
import type {
  RateLimitBoundStatement,
  RateLimitDatabase,
  RateLimitPreparedStatement,
  RateLimitResult,
} from "@/lib/rate-limit";

class MemoryRateLimitDatabase implements RateLimitDatabase {
  readonly counts = new Map<string, number>();

  async batch(
    statements: readonly RateLimitBoundStatement[],
  ): Promise<readonly RateLimitResult[]> {
    return statements.map((statement) => {
      const scope = statement.values[0];
      if (typeof scope !== "string") {
        throw new Error("Unexpected fake D1 scope.");
      }
      const nextCount = (this.counts.get(scope) ?? 0) + 1;
      this.counts.set(scope, nextCount);
      return {
        results: [{ request_count: nextCount }],
        success: true,
      };
    });
  }

  async exec(): Promise<void> {}

  prepare(): RateLimitPreparedStatement {
    return {
      bind: (...values: readonly unknown[]) => ({ values }),
    };
  }
}

class LimitedRateLimitDatabase extends MemoryRateLimitDatabase {
  override async batch(
    statements: readonly RateLimitBoundStatement[],
  ): Promise<readonly RateLimitResult[]> {
    return statements.map(() => ({
      results: [{ request_count: 4 }],
      success: true,
    }));
  }
}

function createRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request("https://blog.chaosyn.com/api/submit-friend-link", {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Origin: "https://blog.chaosyn.com",
      ...headers,
    },
    method: "POST",
  });
}

function createEnvironment(
  database: RateLimitDatabase = new MemoryRateLimitDatabase(),
): FriendLinkApplicationEnv {
  return {
    APP_DB: database,
    NOTION_FRIEND_LINK_DATABASE_ID: "database-id",
    NOTION_TOKEN: "not-a-real-token",
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("submit-friend-link Pages Function", () => {
  it("rejects invalid input before contacting Notion", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const response = await onRequestPost({
      env: createEnvironment(),
      request: createRequest({
        description: "Unsafe",
        name: "Example",
        url: "javascript:alert(1)",
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_REQUEST",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("writes a valid application to Notion with pending status", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await onRequestPost({
      env: createEnvironment(),
      request: createRequest({
        avatar: "https://example.org/avatar.png",
        description: "A quiet personal site.",
        name: "Example",
        url: "https://example.org",
      }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      code: "SUBMITTED",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.notion.com/v1/pages");
    expect(init).toMatchObject({
      headers: {
        "Notion-Version": "2022-06-28",
      },
      method: "POST",
    });
    expect(JSON.parse(String(init?.body))).toMatchObject({
      parent: { database_id: "database-id" },
      properties: {
        状态: { select: { name: "待审核" } },
      },
    });
  });

  it("rejects cross-site requests and rate-limited clients", async () => {
    const crossSiteResponse = await onRequestPost({
      env: createEnvironment(),
      request: createRequest(
        {
          description: "A site",
          name: "Example",
          url: "https://example.org",
        },
        { Origin: "https://evil.example" },
      ),
    });
    expect(crossSiteResponse.status).toBe(403);

    const limitedResponse = await onRequestPost({
      env: createEnvironment(new LimitedRateLimitDatabase()),
      request: createRequest({
        description: "A site",
        name: "Example",
        url: "https://example.org",
      }),
    });
    expect(limitedResponse.status).toBe(429);
    await expect(limitedResponse.json()).resolves.toMatchObject({
      code: "RATE_LIMITED",
    });
  });

  it("fails closed when runtime secrets or D1 are missing", async () => {
    const response = await onRequestPost({
      env: {},
      request: createRequest({
        description: "A site",
        name: "Example",
        url: "https://example.org",
      }),
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });
});
