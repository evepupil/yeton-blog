export type AiSearchErrorCode =
  | "INVALID_REQUEST"
  | "QUERY_REQUIRED"
  | "QUERY_TOO_LONG"
  | "ORIGIN_NOT_ALLOWED"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "UPSTREAM_ERROR"
  | "UPSTREAM_TIMEOUT"
  | "NO_CITATIONS";

export const aiSearchErrorCodes = [
  "INVALID_REQUEST",
  "QUERY_REQUIRED",
  "QUERY_TOO_LONG",
  "ORIGIN_NOT_ALLOWED",
  "RATE_LIMITED",
  "SERVICE_UNAVAILABLE",
  "UPSTREAM_ERROR",
  "UPSTREAM_TIMEOUT",
  "NO_CITATIONS",
] as const satisfies readonly AiSearchErrorCode[];

export function isAiSearchErrorCode(
  value: unknown,
): value is AiSearchErrorCode {
  return (
    typeof value === "string" &&
    (aiSearchErrorCodes as readonly string[]).includes(value)
  );
}

export interface AiSearchCitation {
  readonly filename: string;
  readonly href: string;
  readonly score: number | null;
  readonly title: string;
}

export interface AiSearchErrorPayload {
  readonly code: AiSearchErrorCode;
  readonly requestId: string;
  readonly retryable: boolean;
}

export type AiSearchStreamEvent =
  | {
      readonly data: { readonly text: string };
      readonly event: "delta";
    }
  | {
      readonly data: {
        readonly citations: readonly AiSearchCitation[];
      };
      readonly event: "citations";
    }
  | {
      readonly data: { readonly requestId: string };
      readonly event: "done";
    }
  | {
      readonly data: AiSearchErrorPayload;
      readonly event: "error";
    };

export interface SseFrame {
  readonly data: string;
  readonly event: string;
}
