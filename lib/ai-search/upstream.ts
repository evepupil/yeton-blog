import type { SseFrame } from "@/lib/ai-search/types";

interface AutoRagPayload {
  readonly response: string | null;
  readonly sources: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function decodeAutoRagFrame(frame: SseFrame): AutoRagPayload | null {
  if (frame.data.trim() === "[DONE]") return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(frame.data);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  const payload = isRecord(parsed.result) ? parsed.result : parsed;
  return {
    response: typeof payload.response === "string" ? payload.response : null,
    sources: payload.data,
  };
}

export function getCumulativeDelta(
  previous: string,
  current: string,
): { readonly delta: string; readonly fullText: string } | null {
  if (current === previous || previous.startsWith(current)) {
    return { delta: "", fullText: previous };
  }
  if (!current.startsWith(previous)) {
    return null;
  }

  return {
    delta: current.slice(previous.length),
    fullText: current,
  };
}
