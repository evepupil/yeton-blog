import { describe, expect, it } from "vitest";

import {
  consumeAiRateLimit,
  type AiRateLimitDatabase,
  type D1BoundStatement,
} from "@/lib/ai-search/rate-limit";

class MemoryRateLimitDatabase implements AiRateLimitDatabase {
  readonly counts = new Map<
    string,
    { readonly count: number; readonly windowStartedAt: number }
  >();
  readonly scopes: string[] = [];

  async batch(statements: readonly D1BoundStatement[]): Promise<
    readonly {
      readonly results: readonly { readonly request_count: number }[];
      readonly success: true;
    }[]
  > {
    return statements.map((statement) => {
      const [scope, windowStartedAt] = statement.values;
      if (typeof scope !== "string" || typeof windowStartedAt !== "number") {
        throw new Error("Unexpected fake D1 statement.");
      }
      this.scopes.push(scope);
      const current = this.counts.get(scope);
      const count =
        current?.windowStartedAt === windowStartedAt ? current.count + 1 : 1;
      this.counts.set(scope, { count, windowStartedAt });
      return { results: [{ request_count: count }], success: true };
    });
  }

  async exec() {}

  prepare() {
    return {
      bind: (...values: readonly unknown[]) => ({ values }),
    };
  }
}

describe("AI search D1 rate limit", () => {
  it("counts user and global requests inside a fixed window", async () => {
    const database = new MemoryRateLimitDatabase();
    const options = {
      clientKey: "203.0.113.7",
      database,
      globalLimit: 3,
      nowMs: 120_000,
      userLimit: 2,
      windowSeconds: 60,
    } as const;

    await expect(consumeAiRateLimit(options)).resolves.toMatchObject({
      allowed: true,
      globalCount: 1,
      userCount: 1,
    });
    await expect(consumeAiRateLimit(options)).resolves.toMatchObject({
      allowed: true,
      globalCount: 2,
      userCount: 2,
    });
    await expect(consumeAiRateLimit(options)).resolves.toMatchObject({
      allowed: false,
      globalCount: 3,
      userCount: 3,
    });
    await expect(
      consumeAiRateLimit({ ...options, nowMs: 180_000 }),
    ).resolves.toMatchObject({
      allowed: true,
      globalCount: 1,
      userCount: 1,
    });
  });

  it("enforces the global threshold across different users", async () => {
    const database = new MemoryRateLimitDatabase();
    const base = {
      database,
      globalLimit: 2,
      nowMs: 120_000,
      userLimit: 10,
      windowSeconds: 60,
    } as const;

    await consumeAiRateLimit({ ...base, clientKey: "first" });
    await consumeAiRateLimit({ ...base, clientKey: "second" });
    await expect(
      consumeAiRateLimit({ ...base, clientKey: "third" }),
    ).resolves.toMatchObject({
      allowed: false,
      globalCount: 3,
      userCount: 1,
    });
  });

  it("rotates the user hash daily and never stores the raw client key", async () => {
    const database = new MemoryRateLimitDatabase();
    const base = {
      clientKey: "2001:db8::1",
      database,
      globalLimit: 30,
      userLimit: 6,
      windowSeconds: 60,
    } as const;

    await consumeAiRateLimit({ ...base, nowMs: 0 });
    const firstScope = database.scopes[0];
    await consumeAiRateLimit({ ...base, nowMs: 86_400_000 });
    const secondScope = database.scopes[2];

    expect(firstScope).toMatch(/^user:[a-f0-9]{64}$/u);
    expect(secondScope).toMatch(/^user:[a-f0-9]{64}$/u);
    expect(firstScope).not.toBe(secondScope);
    expect(database.scopes.join(" ")).not.toContain(base.clientKey);
  });
});
