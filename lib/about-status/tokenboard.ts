import { z } from "zod";

import type { TokenBoardStatus } from "./types";

const tokenCountSchema = z.number().int().nonnegative();

const tokenBoardPublicSchema = z.object({
  month: z.object({ tokens: tokenCountSchema }),
  sourceSplit: z.array(
    z.object({
      source: z.string().trim().min(1),
      totalTokens: tokenCountSchema,
    }),
  ),
  today: z.object({ tokens: tokenCountSchema }),
  topModels: z.array(
    z.object({
      model: z.string().trim().min(1),
      totalTokens: tokenCountSchema,
    }),
  ),
  total: z.object({ tokens: tokenCountSchema }),
});

export function parseTokenBoardStatus(value: unknown): TokenBoardStatus {
  const result = tokenBoardPublicSchema.parse(value);

  return {
    monthTokens: result.month.tokens,
    sourceSplit: result.sourceSplit.map(({ source, totalTokens }) => ({
      source,
      totalTokens,
    })),
    todayTokens: result.today.tokens,
    topModels: result.topModels.map(({ model, totalTokens }) => ({
      model,
      totalTokens,
    })),
    totalTokens: result.total.tokens,
  };
}
