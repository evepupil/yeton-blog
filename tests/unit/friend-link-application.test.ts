import { describe, expect, it } from "vitest";

import {
  buildNotionFriendLinkPagePayload,
  parseFriendLinkApplication,
} from "@/lib/friends/application";

describe("friend-link application validation", () => {
  it("trims valid fields and keeps an optional avatar empty", () => {
    const result = parseFriendLinkApplication({
      avatar: "",
      description: "  A quiet personal site.  ",
      name: "  Example  ",
      url: "  https://example.org  ",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        description: "A quiet personal site.",
        honeypot: "",
        name: "Example",
        url: "https://example.org",
      },
    });
  });

  it("rejects unsafe URLs, embedded credentials and unknown fields", () => {
    expect(
      parseFriendLinkApplication({
        description: "Unsafe",
        name: "Example",
        url: "javascript:alert(1)",
      }).ok,
    ).toBe(false);
    expect(
      parseFriendLinkApplication({
        description: "Unsafe",
        name: "Example",
        url: "https://user:password@example.org",
      }).ok,
    ).toBe(false);
    expect(
      parseFriendLinkApplication({
        description: "Unexpected field",
        name: "Example",
        url: "https://example.org",
        unexpected: true,
      }).ok,
    ).toBe(false);
  });
});

describe("friend-link Notion payload", () => {
  it("writes the reference database fields with pending status", () => {
    const parsed = parseFriendLinkApplication({
      avatar: "https://example.org/avatar.png",
      description: "A quiet personal site.",
      name: "Example",
      url: "https://example.org",
    });

    if (!parsed.ok) throw new Error("Expected a valid application.");

    expect(
      buildNotionFriendLinkPagePayload({
        application: parsed.value,
        databaseId: "database-id",
        submittedAt: "2026-08-11T00:00:00.000Z",
      }),
    ).toEqual({
      parent: { database_id: "database-id" },
      properties: {
        网站名称: { title: [{ text: { content: "Example" } }] },
        网站地址: { url: "https://example.org" },
        网站描述: {
          rich_text: [{ text: { content: "A quiet personal site." } }],
        },
        头像URL: { url: "https://example.org/avatar.png" },
        状态: { select: { name: "待审核" } },
        提交时间: { date: { start: "2026-08-11T00:00:00.000Z" } },
      },
    });
  });
});
