import { parse, type DefaultTreeAdapterMap } from "parse5";

import type { GitHubContributionDay, GitHubContributionStatus } from "./types";

type HtmlElement = DefaultTreeAdapterMap["element"];
type HtmlNode = DefaultTreeAdapterMap["node"];

const contributionLevelPattern = /^[0-4]$/u;
const contributionDatePattern = /^\d{4}-\d{2}-\d{2}$/u;

function isElement(node: HtmlNode): node is HtmlElement {
  return "tagName" in node;
}

function getAttribute(element: HtmlElement, name: string): string | null {
  return (
    element.attrs.find((attribute) => attribute.name === name)?.value ?? null
  );
}

function getText(node: HtmlNode): string {
  if (node.nodeName === "#text" && "value" in node) return node.value;
  if (!("childNodes" in node)) return "";
  return node.childNodes.map(getText).join("");
}

function collectElements(node: HtmlNode, elements: HtmlElement[]): void {
  if (isElement(node)) elements.push(node);
  if (!("childNodes" in node)) return;
  for (const child of node.childNodes) collectElements(child, elements);
}

function parseContributionCount(text: string): number | null {
  const normalized = text.replace(/\s+/gu, " ").trim();
  if (/^No contributions?\b/iu.test(normalized)) return 0;

  const match = normalized.match(/([\d,]+)\s+contributions?\b/iu);
  if (!match?.[1]) return null;

  const count = Number(match[1].replaceAll(",", ""));
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
}

export function parseGitHubContributions(
  html: string,
  username: string,
): GitHubContributionStatus {
  const document = parse(html);
  const elements: HtmlElement[] = [];
  collectElements(document, elements);

  const countsByCellId = new Map<string, number>();
  for (const element of elements) {
    if (element.tagName !== "tool-tip") continue;
    const target = getAttribute(element, "for");
    const count = parseContributionCount(getText(element));
    if (target && count !== null) countsByCellId.set(target, count);
  }

  const daysByDate = new Map<string, GitHubContributionDay>();
  for (const element of elements) {
    if (element.tagName !== "td") continue;

    const classes = getAttribute(element, "class")?.split(/\s+/u) ?? [];
    if (!classes.includes("ContributionCalendar-day")) continue;

    const date = getAttribute(element, "data-date");
    const rawLevel = getAttribute(element, "data-level");
    const id = getAttribute(element, "id");
    if (
      !date ||
      !contributionDatePattern.test(date) ||
      !rawLevel ||
      !contributionLevelPattern.test(rawLevel)
    ) {
      continue;
    }

    const level = Number(rawLevel) as GitHubContributionDay["level"];
    const count = id ? countsByCellId.get(id) : undefined;
    if (count === undefined && level > 0) {
      throw new Error(`GitHub contribution count is missing for ${date}.`);
    }

    daysByDate.set(date, { count: count ?? 0, date, level });
  }

  const days = [...daysByDate.values()].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  if (days.length === 0) {
    throw new Error("GitHub contribution calendar did not contain any days.");
  }

  return {
    activeDays: days.filter((day) => day.count > 0).length,
    days,
    totalContributions: days.reduce((total, day) => total + day.count, 0),
    username,
  };
}
