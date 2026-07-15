import { z } from "zod";

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

type EnvironmentValues = Readonly<Record<string, string | undefined>>;

export function readGiscusConfig(
  environment: EnvironmentValues = process.env,
): GiscusConfig | null {
  const values = {
    repo: environment.NEXT_PUBLIC_GISCUS_REPO?.trim() ?? "",
    repoId: environment.NEXT_PUBLIC_GISCUS_REPO_ID?.trim() ?? "",
    category: environment.NEXT_PUBLIC_GISCUS_CATEGORY?.trim() ?? "",
    categoryId: environment.NEXT_PUBLIC_GISCUS_CATEGORY_ID?.trim() ?? "",
  };

  if (Object.values(values).every((value) => !value)) {
    return null;
  }

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
