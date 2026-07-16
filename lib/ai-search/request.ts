import type { AiSearchErrorCode } from "@/lib/ai-search/types";

export type QueryValidationResult =
  | { readonly ok: true; readonly query: string }
  | { readonly code: AiSearchErrorCode; readonly ok: false };

export function validateAiSearchQuery(
  payload: unknown,
  maxQueryLength: number,
): QueryValidationResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { code: "INVALID_REQUEST", ok: false };
  }

  const query = Reflect.get(payload, "query");
  if (typeof query !== "string") {
    return { code: "INVALID_REQUEST", ok: false };
  }

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return { code: "QUERY_REQUIRED", ok: false };
  }
  if (Array.from(trimmedQuery).length > maxQueryLength) {
    return { code: "QUERY_TOO_LONG", ok: false };
  }

  return { ok: true, query: trimmedQuery };
}

export function isAllowedRequestOrigin(request: Request): boolean {
  if (request.headers.get("Sec-Fetch-Site") === "cross-site") {
    return false;
  }

  const origin = request.headers.get("Origin");
  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
