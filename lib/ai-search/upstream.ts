import type { SseFrame } from "@/lib/ai-search/types";

interface AutoRagPayload {
  readonly response: string | null;
  readonly sources: unknown;
}

export type AutoRagResponseMode = "cumulative" | "delta" | "unknown";

export interface AutoRagDeltaResult {
  readonly delta: string;
  readonly fullText: string;
  readonly mode: AutoRagResponseMode;
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

export function getAutoRagDelta(
  previous: string,
  current: string,
  mode: AutoRagResponseMode,
): AutoRagDeltaResult | null {
  if (!current) return { delta: "", fullText: previous, mode };
  if (mode === "delta") {
    return {
      delta: current,
      fullText: previous + current,
      mode,
    };
  }

  if (!previous) {
    return { delta: current, fullText: current, mode };
  }
  if (current === previous || previous.startsWith(current)) {
    return { delta: "", fullText: previous, mode: "cumulative" };
  }
  if (current.startsWith(previous)) {
    return {
      delta: current.slice(previous.length),
      fullText: current,
      mode: "cumulative",
    };
  }
  if (mode === "cumulative") {
    return null;
  }

  return {
    delta: current,
    fullText: previous + current,
    mode: "delta",
  };
}
