import { describe, expect, it } from "vitest";

import { parseFriendLinks } from "@/lib/friends/repository";

describe("friend link data", () => {
  it("accepts the synchronized friend-link shape", () => {
    expect(
      parseFriendLinks({
        friends: [
          {
            avatar: "/images/friends/example.webp",
            description: "A quiet personal site.",
            name: "Example",
            url: "https://example.org",
          },
        ],
      }),
    ).toEqual([
      {
        avatar: "/images/friends/example.webp",
        description: "A quiet personal site.",
        name: "Example",
        url: "https://example.org",
      },
    ]);
  });

  it("rejects unsafe URLs and remote avatar paths", () => {
    expect(() =>
      parseFriendLinks({
        friends: [
          {
            avatar: "https://cdn.example.org/avatar.png",
            description: "Unsafe data",
            name: "Example",
            url: "javascript:alert(1)",
          },
        ],
      }),
    ).toThrow();
  });
});
