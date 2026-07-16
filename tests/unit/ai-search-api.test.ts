import { beforeEach, describe, expect, it, vi } from "vitest";

import { onRequestPost, type AiSearchEnv } from "@/functions/api/ai-search";

function createUpstreamResponse(chunks: readonly string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
    {
      headers: { "Content-Type": "text/event-stream" },
      status: 200,
    },
  );
}

function createRequest(
  body: unknown = { query: "Cloudflare AI" },
  headers: Readonly<Record<string, string>> = {},
): Request {
  return new Request("https://blog.example.com/api/ai-search", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
    method: "POST",
  });
}

function createEnv(options?: {
  readonly globalAllowed?: boolean;
  readonly userAllowed?: boolean;
}): {
  readonly aiSearch: ReturnType<typeof vi.fn>;
  readonly env: AiSearchEnv;
  readonly globalLimit: ReturnType<typeof vi.fn>;
  readonly userLimit: ReturnType<typeof vi.fn>;
} {
  const aiSearch = vi
    .fn()
    .mockResolvedValue(
      createUpstreamResponse([
        'data: {"response":"Cloud","data":[{"filename":"content/posts/zh/claude-code里面使用chatgpt的模型教程.md","score":0.9}]}\n',
        '\ndata: {"response":"Cloudflare","data":[{"filename":"content/posts/zh/claude-code里面使用chatgpt的模型教程.md","score":0.9}]}\n\n',
      ]),
    );
  const userLimit = vi.fn().mockResolvedValue({
    success: options?.userAllowed ?? true,
  });
  const globalLimit = vi.fn().mockResolvedValue({
    success: options?.globalAllowed ?? true,
  });

  return {
    aiSearch,
    env: {
      AI: { autorag: () => ({ aiSearch }) },
      AI_GLOBAL_RATE_LIMITER: { limit: globalLimit },
      AI_USER_RATE_LIMITER: { limit: userLimit },
    },
    globalLimit,
    userLimit,
  };
}

describe("AI search Pages Function", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  it("streams non-duplicated deltas followed by canonical citations", async () => {
    const { aiSearch, env, globalLimit, userLimit } = createEnv();
    const response = await onRequestPost({
      env,
      request: createRequest(undefined, {
        "CF-Connecting-IP": "203.0.113.4",
        Origin: "https://blog.example.com",
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    expect(userLimit).toHaveBeenCalledWith({ key: "203.0.113.4" });
    expect(globalLimit).toHaveBeenCalledWith({ key: "global" });
    expect(aiSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        max_num_results: 5,
        query: "Cloudflare AI",
        stream: true,
      }),
    );

    const body = await response.text();
    expect(body).toContain('data: {"text":"Cloud"}');
    expect(body).toContain('data: {"text":"flare"}');
    expect(body).not.toContain('data: {"text":"Cloudflare"}');
    expect(body).toContain('"href":"/posts/claude-code-chatgpt-34a4342e/"');
    expect(body).toContain("event: done");
  });

  it("fails closed when AI or rate-limit bindings are missing", async () => {
    const response = await onRequestPost({
      env: {},
      request: createRequest(),
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      retryable: true,
    });
  });

  it("rejects a limited user before consuming the global limit", async () => {
    const { aiSearch, env, globalLimit } = createEnv({ userAllowed: false });
    const response = await onRequestPost({
      env,
      request: createRequest(),
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(globalLimit).not.toHaveBeenCalled();
    expect(aiSearch).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests before consuming any AI quota", async () => {
    const { aiSearch, env, userLimit } = createEnv();
    const response = await onRequestPost({
      env,
      request: createRequest(undefined, {
        Origin: "https://other.example.com",
      }),
    });

    expect(response.status).toBe(403);
    expect(userLimit).not.toHaveBeenCalled();
    expect(aiSearch).not.toHaveBeenCalled();
  });
});
