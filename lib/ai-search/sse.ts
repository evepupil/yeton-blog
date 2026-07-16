import type {
  AiSearchCitation,
  AiSearchStreamEvent,
  SseFrame,
} from "@/lib/ai-search/types";
import { isAiSearchErrorCode } from "@/lib/ai-search/types";

export interface SseChunkResult {
  readonly frames: readonly SseFrame[];
  readonly remainder: string;
}

function parseFrame(block: string): SseFrame | null {
  let event = "message";
  const data: string[] = [];

  for (const line of block.split(/\r?\n/u)) {
    if (!line || line.startsWith(":")) continue;

    const separator = line.indexOf(":");
    const field = separator === -1 ? line : line.slice(0, separator);
    const rawValue = separator === -1 ? "" : line.slice(separator + 1);
    const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;

    if (field === "event") event = value;
    if (field === "data") data.push(value);
  }

  if (data.length === 0) return null;
  return { data: data.join("\n"), event };
}

export function parseSseChunk(buffer: string, chunk: string): SseChunkResult {
  let remainder = buffer + chunk;
  const frames: SseFrame[] = [];

  while (true) {
    const separator = /\r?\n\r?\n/u.exec(remainder);
    if (!separator || separator.index === undefined) break;

    const block = remainder.slice(0, separator.index);
    remainder = remainder.slice(separator.index + separator[0].length);
    const frame = parseFrame(block);
    if (frame) frames.push(frame);
  }

  return { frames, remainder };
}

export function flushSseRemainder(remainder: string): SseFrame | null {
  return remainder.trim() ? parseFrame(remainder) : null;
}

export function encodeAiSearchEvent(event: AiSearchStreamEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isCitation(value: unknown): value is AiSearchCitation {
  return (
    isRecord(value) &&
    typeof value.filename === "string" &&
    typeof value.href === "string" &&
    (typeof value.score === "number" || value.score === null) &&
    typeof value.title === "string"
  );
}

export function decodeAiSearchEvent(
  frame: SseFrame,
): AiSearchStreamEvent | null {
  let data: unknown;
  try {
    data = JSON.parse(frame.data);
  } catch {
    return null;
  }
  if (!isRecord(data)) return null;

  if (frame.event === "delta" && typeof data.text === "string") {
    return { data: { text: data.text }, event: "delta" };
  }
  if (
    frame.event === "citations" &&
    Array.isArray(data.citations) &&
    data.citations.every(isCitation)
  ) {
    return {
      data: { citations: data.citations },
      event: "citations",
    };
  }
  if (frame.event === "done" && typeof data.requestId === "string") {
    return { data: { requestId: data.requestId }, event: "done" };
  }
  if (
    frame.event === "error" &&
    isAiSearchErrorCode(data.code) &&
    typeof data.requestId === "string" &&
    typeof data.retryable === "boolean"
  ) {
    return {
      data: {
        code: data.code,
        requestId: data.requestId,
        retryable: data.retryable,
      },
      event: "error",
    };
  }

  return null;
}
