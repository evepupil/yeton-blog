import { z } from "zod";

import readingStatusSource from "@/data/reading-status.json";

import type { ReadingStatus } from "./types";

const optionalCountSchema = z.number().int().nonnegative().nullable();

const readingStatusSchema = z.object({
  activeDays: optionalCountSchema,
  books: z.array(
    z.object({
      author: z.string().trim().min(1),
      cover: z.string().trim(),
      state: z.enum(["finished", "reading", "saved"]),
      title: z.string().trim().min(1),
    }),
  ),
  finishedBooks: optionalCountSchema,
  totalMinutes: optionalCountSchema,
  updatedAt: z.iso.datetime().nullable(),
});

export function parseReadingStatus(value: unknown): ReadingStatus {
  return readingStatusSchema.parse(value);
}

export function getReadingStatus(): ReadingStatus {
  return parseReadingStatus(readingStatusSource);
}
