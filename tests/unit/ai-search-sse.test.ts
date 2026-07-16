import { describe, expect, it } from "vitest";

import {
  decodeAiSearchEvent,
  encodeAiSearchEvent,
  flushSseRemainder,
  parseSseChunk,
} from "@/lib/ai-search/sse";
import { getAutoRagDelta } from "@/lib/ai-search/upstream";

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
    expect(getAutoRagDelta("", "Cloudflare", "unknown")).toEqual({
      delta: "Cloudflare",
      fullText: "Cloudflare",
      mode: "unknown",
    });
    expect(getAutoRagDelta("Cloudflare", "Cloudflare AI", "unknown")).toEqual({
      delta: " AI",
      fullText: "Cloudflare AI",
      mode: "cumulative",
    });
    expect(
      getAutoRagDelta("Cloudflare AI", "Cloudflare", "cumulative"),
    ).toEqual({
      delta: "",
      fullText: "Cloudflare AI",
      mode: "cumulative",
    });
    expect(getAutoRagDelta("Cloudflare", "AutoRAG", "cumulative")).toBeNull();
  });

  it("appends delta chunks returned by the live reference AutoRAG", () => {
    const first = getAutoRagDelta("", "According", "unknown");
    expect(first).toEqual({
      delta: "According",
      fullText: "According",
      mode: "unknown",
    });
    const second = getAutoRagDelta(
      first!.fullText,
      " to the provided",
      first!.mode,
    );
    expect(second).toEqual({
      delta: " to the provided",
      fullText: "According to the provided",
      mode: "delta",
    });
    expect(
      getAutoRagDelta(second!.fullText, " documents", second!.mode),
    ).toEqual({
      delta: " documents",
      fullText: "According to the provided documents",
      mode: "delta",
    });
  });
});
