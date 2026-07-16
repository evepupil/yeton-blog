import { afterEach, describe, expect, it, vi } from "vitest";

import { streamAiSearch } from "@/features/ai-search/ai-search-client";
import { encodeAiSearchEvent } from "@/lib/ai-search/sse";
import type { AiSearchStreamEvent } from "@/lib/ai-search/types";

describe("AI search browser client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads split stream events until the done event", async () => {
    const events: AiSearchStreamEvent[] = [];
    const body = `${encodeAiSearchEvent({
      data: { text: "答" },
      event: "delta",
    })}${encodeAiSearchEvent({
      data: { requestId: "request-1" },
      event: "done",
    })}`;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(body, {
          headers: { "Content-Type": "text/event-stream" },
        }),
      ),
    );

    await streamAiSearch({
      endpoint: "/api/ai-search",
      onEvent: (event) => events.push(event),
      query: "问题",
      signal: new AbortController().signal,
    });

    expect(events).toEqual([
      { data: { text: "答" }, event: "delta" },
      { data: { requestId: "request-1" }, event: "done" },
    ]);
  });

  it("maps structured HTTP failures to a retryable client error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { code: "RATE_LIMITED", requestId: "1", retryable: true },
            { status: 429 },
          ),
        ),
    );

    await expect(
      streamAiSearch({
        endpoint: "/api/ai-search",
        onEvent: () => undefined,
        query: "问题",
        signal: new AbortController().signal,
      }),
    ).rejects.toMatchObject({
      code: "RATE_LIMITED",
      retryable: true,
    });
  });
});
