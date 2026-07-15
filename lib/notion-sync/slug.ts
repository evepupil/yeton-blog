const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function normalizeSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 80);
}

export function createNotionSlug(
  title: string,
  pageId: string,
  explicitSlug?: string,
): string {
  if (explicitSlug) {
    const normalizedExplicitSlug = normalizeSlug(explicitSlug);
    if (!slugPattern.test(normalizedExplicitSlug)) {
      throw new Error(`Notion Slug is invalid: ${explicitSlug}`);
    }
    return normalizedExplicitSlug;
  }

  const titleSlug = normalizeSlug(title);
  const pageSuffix = pageId.replaceAll("-", "").slice(0, 8).toLowerCase();
  if (!/^[a-f0-9]{8}$/u.test(pageSuffix)) {
    throw new Error(`Notion page ID is invalid: ${pageId}`);
  }

  return titleSlug ? `${titleSlug}-${pageSuffix}` : `notion-${pageSuffix}`;
}
