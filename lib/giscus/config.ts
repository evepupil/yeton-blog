import { z } from "zod";

import { siteConfig } from "@/site.config";

const giscusConfigSchema = z.strictObject({
  repo: z
    .string()
    .trim()
    .regex(/^[^\s/]+\/[^\s/]+$/u),
  repoId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]+$/u),
  category: z.string().trim().min(1),
  categoryId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]+$/u),
});

export type GiscusConfig = z.infer<typeof giscusConfigSchema>;

export interface GiscusSettings extends GiscusConfig {
  readonly enabled: boolean;
}

const playwrightGiscusSettings: GiscusSettings = {
  category: "General",
  categoryId: "DIC_test",
  enabled: true,
  repo: "example/blog",
  repoId: "R_test",
};

export function resolveGiscusConfig(
  settings: GiscusSettings,
): GiscusConfig | null {
  if (!settings.enabled) return null;

  const values = {
    category: settings.category,
    categoryId: settings.categoryId,
    repo: settings.repo,
    repoId: settings.repoId,
  };

  const result = giscusConfigSchema.safeParse(values);
  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `Giscus configuration is incomplete or invalid: ${fields}.`,
    );
  }
  return result.data;
}

export function readGiscusConfig(
  usePlaywrightFixture = process.env.PLAYWRIGHT_TEST_COMMENTS === "1",
): GiscusConfig | null {
  return resolveGiscusConfig(
    usePlaywrightFixture
      ? playwrightGiscusSettings
      : siteConfig.integrations.comments,
  );
}
