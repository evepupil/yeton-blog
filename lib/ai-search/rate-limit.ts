import {
  cleanupOldRateLimits,
  consumeRateLimit,
  type ConsumeRateLimitOptions,
  type RateLimitDatabase,
  type RateLimitDecision,
  type RateLimitBoundStatement,
  type RateLimitPreparedStatement,
  type RateLimitResult,
} from "@/lib/rate-limit";

export type D1BoundStatement = RateLimitBoundStatement;
export type D1PreparedStatement = RateLimitPreparedStatement;
export type D1Result = RateLimitResult;
export type AiRateLimitDatabase = RateLimitDatabase;
export type AiRateLimitDecision = RateLimitDecision;

type AiRateLimitOptions = Omit<ConsumeRateLimitOptions, "namespace">;

export function consumeAiRateLimit(
  options: AiRateLimitOptions,
): Promise<AiRateLimitDecision> {
  return consumeRateLimit({ ...options, namespace: undefined });
}

export function cleanupOldAiRateLimits(
  database: AiRateLimitDatabase,
  nowMs?: number,
): Promise<void> {
  return cleanupOldRateLimits(database, nowMs);
}
