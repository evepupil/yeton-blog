import { describe, expect, it } from "vitest";

import { readGiscusConfig } from "@/lib/giscus/config";

const completeConfiguration = {
  NEXT_PUBLIC_GISCUS_REPO: "evepupil/yeton-blog",
  NEXT_PUBLIC_GISCUS_REPO_ID: "R_kgDOTY-rvQ",
  NEXT_PUBLIC_GISCUS_CATEGORY: "General",
  NEXT_PUBLIC_GISCUS_CATEGORY_ID: "DIC_example",
} as const;

describe("Giscus configuration", () => {
  it("keeps comments disabled when every setting is absent", () => {
    expect(readGiscusConfig({})).toBeNull();
  });

  it("accepts a complete public configuration", () => {
    expect(readGiscusConfig(completeConfiguration)).toEqual({
      category: "General",
      categoryId: "DIC_example",
      repo: "evepupil/yeton-blog",
      repoId: "R_kgDOTY-rvQ",
    });
  });

  it("rejects partial or malformed configuration", () => {
    expect(() =>
      readGiscusConfig({ NEXT_PUBLIC_GISCUS_REPO: "evepupil/yeton-blog" }),
    ).toThrow("incomplete or invalid");
    expect(() =>
      readGiscusConfig({
        ...completeConfiguration,
        NEXT_PUBLIC_GISCUS_REPO: "missing-owner",
      }),
    ).toThrow("incomplete or invalid");
  });
});
