import { describe, expect, it } from "vitest";

import { readGiscusConfig, resolveGiscusConfig } from "@/lib/giscus/config";

const completeSettings = {
  category: "General",
  categoryId: "DIC_example",
  repo: "evepupil/yeton-blog",
  repoId: "R_kgDOTY-rvQ",
} as const;

describe("Giscus configuration", () => {
  it("uses the disabled central setting outside Playwright", () => {
    expect(readGiscusConfig(false)).toBeNull();
  });

  it("accepts an enabled central setting", () => {
    expect(resolveGiscusConfig({ enabled: true, ...completeSettings })).toEqual(
      {
        category: "General",
        categoryId: "DIC_example",
        repo: "evepupil/yeton-blog",
        repoId: "R_kgDOTY-rvQ",
      },
    );
  });

  it("provides a complete isolated Playwright fixture", () => {
    expect(readGiscusConfig(true)).toEqual({
      category: "General",
      categoryId: "DIC_test",
      repo: "example/blog",
      repoId: "R_test",
    });
  });

  it("rejects malformed enabled settings", () => {
    expect(() =>
      resolveGiscusConfig({
        enabled: true,
        ...completeSettings,
        repo: "missing-owner",
      }),
    ).toThrow("incomplete or invalid");
  });
});
