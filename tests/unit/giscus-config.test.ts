import { describe, expect, it } from "vitest";

import { readGiscusConfig, resolveGiscusConfig } from "@/lib/giscus/config";

const completeSettings = {
  category: "General",
  categoryId: "DIC_example",
  repo: "evepupil/yeton-blog",
  repoId: "R_kgDOTY-rvQ",
} as const;

describe("Giscus configuration", () => {
  it("reads the enabled central setting outside Playwright", () => {
    expect(readGiscusConfig(false)).toEqual({
      category: "General",
      categoryId: "DIC_kwDOTY-rvc4DBSku",
      repo: "evepupil/yeton-blog",
      repoId: "R_kgDOTY-rvQ",
    });
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
