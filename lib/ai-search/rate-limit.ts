export interface D1BoundStatement {
  readonly values: readonly unknown[];
}

export interface D1PreparedStatement {
  bind(...values: readonly unknown[]): D1BoundStatement;
}

export interface D1Result {
  readonly results?: readonly Readonly<Record<string, unknown>>[];
  readonly success: boolean;
}

export interface AiRateLimitDatabase {
  batch(statements: readonly D1BoundStatement[]): Promise<readonly D1Result[]>;
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<unknown>;
}

interface ConsumeRateLimitOptions {
  readonly clientKey: string;
  readonly database: AiRateLimitDatabase;
  readonly globalLimit: number;
  readonly nowMs?: number;
  readonly userLimit: number;
  readonly windowSeconds: number;
}

export interface AiRateLimitDecision {
  readonly allowed: boolean;
  readonly globalCount: number;
  readonly userCount: number;
}

const incrementStatement = `
  INSERT INTO ai_rate_limits (
    scope,
    window_started_at,
    request_count,
    updated_at
  ) VALUES (?1, ?2, 1, ?3)
  ON CONFLICT(scope) DO UPDATE SET
    window_started_at = excluded.window_started_at,
    request_count = CASE
      WHEN ai_rate_limits.window_started_at = excluded.window_started_at
      THEN ai_rate_limits.request_count + 1
      ELSE 1
    END,
    updated_at = excluded.updated_at
  RETURNING request_count
`;

async function hashClientKey(clientKey: string, day: number): Promise<string> {
  const bytes = new TextEncoder().encode(`${day}:${clientKey}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}

function readCount(result: D1Result | undefined): number {
  const count = result?.results?.[0]?.request_count;
  if (!result?.success || typeof count !== "number") {
    throw new Error("D1 did not return a rate-limit count.");
  }
  return count;
}

export async function consumeAiRateLimit({
  clientKey,
  database,
  globalLimit,
  nowMs = Date.now(),
  userLimit,
  windowSeconds,
}: ConsumeRateLimitOptions): Promise<AiRateLimitDecision> {
  const windowMs = windowSeconds * 1_000;
  const windowStartedAt = Math.floor(nowMs / windowMs) * windowMs;
  const day = Math.floor(nowMs / 86_400_000);
  const userHash = await hashClientKey(clientKey, day);
  const statements = [
    database
      .prepare(incrementStatement)
      .bind(`user:${userHash}`, windowStartedAt, nowMs),
    database.prepare(incrementStatement).bind("global", windowStartedAt, nowMs),
  ];
  const results = await database.batch(statements);
  const userCount = readCount(results[0]);
  const globalCount = readCount(results[1]);

  return {
    allowed: userCount <= userLimit && globalCount <= globalLimit,
    globalCount,
    userCount,
  };
}

export async function cleanupOldAiRateLimits(
  database: AiRateLimitDatabase,
  nowMs = Date.now(),
): Promise<void> {
  const cutoff = nowMs - 2 * 86_400_000;
  await database.exec(
    `DELETE FROM ai_rate_limits WHERE updated_at < ${Math.floor(cutoff)}`,
  );
}
