import {
  flushSseRemainder,
  parseSseChunk,
  decodeAiSearchEvent,
} from "@/lib/ai-search/sse";
import type {
  AiSearchErrorCode,
  AiSearchStreamEvent,
  SseFrame,
} from "@/lib/ai-search/types";
import { isAiSearchErrorCode } from "@/lib/ai-search/types";

export class AiSearchClientError extends Error {
  readonly code: AiSearchErrorCode;
  readonly retryable: boolean;

  constructor(code: AiSearchErrorCode, retryable: boolean) {
    super(code);
    this.name = "AiSearchClientError";
    this.code = code;
    this.retryable = retryable;
  }
}

interface StreamAiSearchOptions {
  readonly endpoint: string;
  readonly onEvent: (event: AiSearchStreamEvent) => void;
  readonly query: string;
  readonly signal: AbortSignal;
}

async function readHttpError(response: Response): Promise<AiSearchClientError> {
  try {
    const payload: unknown = await response.json();
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const code = Reflect.get(payload, "code");
      const retryable = Reflect.get(payload, "retryable");
      if (isAiSearchErrorCode(code) && typeof retryable === "boolean") {
        return new AiSearchClientError(code, retryable);
      }
    }
  } catch {
    // The status fallback below covers invalid or empty error bodies.
  }

  if (response.status === 429) {
    return new AiSearchClientError("RATE_LIMITED", true);
  }
  return new AiSearchClientError("SERVICE_UNAVAILABLE", true);
}

function handleFrame(
  frame: SseFrame,
  onEvent: (event: AiSearchStreamEvent) => void,
): boolean {
  const event = decodeAiSearchEvent(frame);
  if (!event) return false;
  if (event.event === "error") {
    throw new AiSearchClientError(event.data.code, event.data.retryable);
  }

  onEvent(event);
  return event.event === "done";
}

export async function streamAiSearch({
  endpoint,
  onEvent,
  query,
  signal,
}: StreamAiSearchOptions): Promise<void> {
  const response = await fetch(endpoint, {
    body: JSON.stringify({ query }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal,
  });
  if (!response.ok) throw await readHttpError(response);
  if (!response.body) {
    throw new AiSearchClientError("UPSTREAM_ERROR", true);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;

  try {
    while (!completed) {
      const result = await reader.read();
      if (result.done) break;

      const parsed = parseSseChunk(
        buffer,
        decoder.decode(result.value, { stream: true }),
      );
      buffer = parsed.remainder;
      for (const frame of parsed.frames) {
        completed = handleFrame(frame, onEvent);
        if (completed) break;
      }
    }

    buffer += decoder.decode();
    if (!completed) {
      const finalFrame = flushSseRemainder(buffer);
      if (finalFrame) completed = handleFrame(finalFrame, onEvent);
    }
    if (!completed) {
      throw new AiSearchClientError("UPSTREAM_ERROR", true);
    }
  } finally {
    reader.releaseLock();
  }
}
