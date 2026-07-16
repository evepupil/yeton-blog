import { describe, expect, it } from "vitest";

import {
  decodeAiSearchEvent,
  encodeAiSearchEvent,
  flushSseRemainder,
  parseSseChunk,
} from "@/lib/ai-search/sse";
import { getCumulativeDelta } from "@/lib/ai-search/upstream";

describe("AI search SSE protocol", () => {
  it("keeps incomplete frames between network chunks", () => {
    const first = parseSseChunk("", 'event: delta\r\ndata: {"text":"你');
    expect(first.frames).toEqual([]);

    const second = parseSseChunk(first.remainder, '好"}\r\n\r\n');
    expect(second).toEqual({
      frames: [{ data: '{"text":"你好"}', event: "delta" }],
      remainder: "",
    });
  });

  it("supports multi-line data and a final frame without a separator", () => {
    const parsed = parseSseChunk(
      "",
      "event: note\ndata: first\ndata: second\n\n",
    );
    expect(parsed.frames[0]).toEqual({
      data: "first\nsecond",
      event: "note",
    });
    expect(flushSseRemainder('event: done\ndata: {"requestId":"1"}')).toEqual({
      data: '{"requestId":"1"}',
      event: "done",
    });
  });

  it("encodes and validates public stream events", () => {
    const encoded = encodeAiSearchEvent({
      data: { text: "answer" },
      event: "delta",
    });
    const parsed = parseSseChunk("", encoded);
    expect(decodeAiSearchEvent(parsed.frames[0]!)).toEqual({
      data: { text: "answer" },
      event: "delta",
    });
    expect(
      decodeAiSearchEvent({ data: '{"text":1}', event: "delta" }),
    ).toBeNull();
  });

  it("turns cumulative AutoRAG responses into non-duplicated deltas", () => {
    expect(getCumulativeDelta("", "Cloudflare")).toEqual({
      delta: "Cloudflare",
      fullText: "Cloudflare",
    });
    expect(getCumulativeDelta("Cloudflare", "Cloudflare AI")).toEqual({
      delta: " AI",
      fullText: "Cloudflare AI",
    });
    expect(getCumulativeDelta("Cloudflare AI", "Cloudflare")).toEqual({
      delta: "",
      fullText: "Cloudflare AI",
    });
    expect(getCumulativeDelta("Cloudflare", "AutoRAG")).toBeNull();
  });
});
