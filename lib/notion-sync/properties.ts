import type { PageObjectResponse } from "@notionhq/client";

type PageProperties = PageObjectResponse["properties"];

export function readTitle(
  properties: PageProperties,
  name: string,
): string | undefined {
  const property = properties[name];
  if (!property || property.type !== "title") {
    return undefined;
  }

  const value = property.title
    .map((item) => item.plain_text)
    .join("")
    .trim();
  return value || undefined;
}

export function readRichText(
  properties: PageProperties,
  name: string,
): string | undefined {
  const property = properties[name];
  if (!property || property.type !== "rich_text") {
    return undefined;
  }

  const value = property.rich_text
    .map((item) => item.plain_text)
    .join("")
    .trim();
  return value || undefined;
}

export function readSelect(
  properties: PageProperties,
  name: string,
): string | undefined {
  const property = properties[name];
  return property?.type === "select" ? property.select?.name : undefined;
}

export function readDate(
  properties: PageProperties,
  name: string,
): string | undefined {
  const property = properties[name];
  return property?.type === "date" ? property.date?.start : undefined;
}

export function readMultiSelect(
  properties: PageProperties,
  name: string,
): string[] {
  const property = properties[name];
  if (!property || property.type !== "multi_select") {
    return [];
  }

  return property.multi_select.map((item) => item.name.trim()).filter(Boolean);
}

export function readUrl(
  properties: PageProperties,
  name: string,
): string | undefined {
  const property = properties[name];
  return property?.type === "url" ? (property.url ?? undefined) : undefined;
}

export function readFileUrl(
  properties: PageProperties,
  name: string,
): string | undefined {
  const property = properties[name];
  if (!property || property.type !== "files") {
    return undefined;
  }

  const file = property.files[0];
  if (!file) {
    return undefined;
  }

  return "external" in file ? file.external.url : file.file.url;
}
