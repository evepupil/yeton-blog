const slugPattern = /^[\p{Letter}\p{Number}]+(?:-[\p{Letter}\p{Number}]+)*$/u;

function truncateSlug(value: string): string {
  return [...value].slice(0, 80).join("").replace(/-+$/u, "");
}

function normalizeExplicitSlug(value: string): string {
  const normalized = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

  return truncateSlug(normalized);
}

function normalizeGeneratedSlug(value: string): string {
  return truncateSlug(
    value
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, "-")
      .replace(/^-+|-+$/gu, ""),
  );
}

export function createNotionSlug(
  title: string,
  pageId: string,
  explicitSlug?: string,
): string {
  if (explicitSlug) {
    const normalizedExplicitSlug = normalizeExplicitSlug(explicitSlug);
    if (!slugPattern.test(normalizedExplicitSlug)) {
      throw new Error(`Notion Slug is invalid: ${explicitSlug}`);
    }
    return normalizedExplicitSlug;
  }

  const titleSlug = normalizeGeneratedSlug(title);
  const pageSuffix = pageId.replaceAll("-", "").slice(0, 8).toLowerCase();
  if (!/^[a-f0-9]{8}$/u.test(pageSuffix)) {
    throw new Error(`Notion page ID is invalid: ${pageId}`);
  }

  return titleSlug ? `${titleSlug}-${pageSuffix}` : `notion-${pageSuffix}`;
}
