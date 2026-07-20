import type {
  ReadingBookStatus,
  ReadingStatus,
} from "@/lib/about-status/types";

import type { AnnualReadingStats, ShelfBook } from "./schema";

export interface SelectedShelfBook {
  readonly author: string;
  readonly coverUrl: string;
  readonly state: ReadingBookStatus["state"];
  readonly title: string;
}

export function parseFinishedBookCount(
  readStat: AnnualReadingStats["readStat"],
): number | null {
  const countText = readStat?.find(
    (item) => item.stat.trim() === "读完",
  )?.counts;
  const match = countText?.match(/^\s*([\d,]+)\s*本/u);
  if (!match?.[1]) return null;

  const count = Number.parseInt(match[1].replaceAll(",", ""), 10);
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
}

export function selectRecentPublicBooks(
  books: readonly ShelfBook[],
  limit = 3,
): readonly SelectedShelfBook[] {
  const selected: SelectedShelfBook[] = [];
  const seen = new Set<string>();
  const candidates = books
    .filter(
      (book) =>
        book.secret === 0 &&
        book.title.trim().length > 0 &&
        (book.readUpdateTime ?? 0) > 0,
    )
    .toSorted(
      (left, right) => (right.readUpdateTime ?? 0) - (left.readUpdateTime ?? 0),
    );

  for (const book of candidates) {
    const title = book.title.trim();
    const author = book.author.trim() || "未知作者";
    const identity = `${title}\u0000${author}`;
    if (seen.has(identity)) continue;

    seen.add(identity);
    selected.push({
      author,
      coverUrl: book.cover.trim(),
      state: book.finishReading === 1 ? "finished" : "reading",
      title,
    });
    if (selected.length >= limit) break;
  }

  return selected;
}

export function createReadingStatus(
  annualStats: AnnualReadingStats,
  books: readonly ReadingBookStatus[],
  now: Date,
): ReadingStatus {
  return {
    activeDays: annualStats.readDays ?? null,
    books,
    finishedBooks: parseFinishedBookCount(annualStats.readStat),
    totalMinutes:
      annualStats.totalReadTime === undefined
        ? null
        : Math.floor(annualStats.totalReadTime / 60),
    updatedAt: now.toISOString(),
  };
}
