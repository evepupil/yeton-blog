import { isAllowedRequestOrigin } from "../../lib/ai-search/request";
import {
  buildNotionFriendLinkPagePayload,
  parseFriendLinkApplication,
  type FriendLinkApplicationErrorCode,
} from "../../lib/friends/application";
import {
  consumeFriendLinkRateLimit,
  type FriendLinkRateLimitDatabase,
} from "../../lib/friends/rate-limit";

export interface FriendLinkApplicationEnv {
  readonly APP_DB?: FriendLinkRateLimitDatabase;
  readonly NOTION_FRIEND_LINK_DATABASE_ID?: string;
  readonly NOTION_TOKEN?: string;
}

interface PagesFunctionContext {
  readonly env: FriendLinkApplicationEnv;
  readonly request: Request;
}

const maxBodyBytes = 8_192;
const notionApiUrl = "https://api.notion.com/v1/pages";
const notionApiVersion = "2022-06-28";
const rateLimit = {
  globalRequests: 60,
  userRequests: 3,
  windowSeconds: 3_600,
} as const;

function responseHeaders(requestId: string): Headers {
  return new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Request-ID": requestId,
  });
}

function errorResponse(
  code: Exclude<FriendLinkApplicationErrorCode, "SUBMITTED">,
  status: number,
  requestId: string,
  retryable: boolean,
): Response {
  const headers = responseHeaders(requestId);
  if (status === 429) headers.set("Retry-After", "3600");

  return new Response(JSON.stringify({ code, requestId, retryable }), {
    headers,
    status,
  });
}

function submittedResponse(requestId: string): Response {
  return new Response(JSON.stringify({ code: "SUBMITTED", requestId }), {
    headers: responseHeaders(requestId),
    status: 201,
  });
}

function getClientKey(request: Request): string {
  return request.headers.get("CF-Connecting-IP")?.trim() || "unknown";
}

function logEvent(
  level: "error" | "info",
  event: string,
  requestId: string,
  details: Readonly<Record<string, unknown>> = {},
): void {
  console[level](JSON.stringify({ event, requestId, ...details }));
}

export async function onRequestPost({
  env,
  request,
}: PagesFunctionContext): Promise<Response> {
  const requestId = crypto.randomUUID();

  if (!isAllowedRequestOrigin(request)) {
    return errorResponse("ORIGIN_NOT_ALLOWED", 403, requestId, false);
  }
  if (!request.headers.get("Content-Type")?.includes("application/json")) {
    return errorResponse("INVALID_REQUEST", 415, requestId, false);
  }

  const notionToken = env.NOTION_TOKEN?.trim();
  const databaseId = env.NOTION_FRIEND_LINK_DATABASE_ID?.trim();
  if (!notionToken || !databaseId || !env.APP_DB) {
    return errorResponse("SERVICE_UNAVAILABLE", 503, requestId, true);
  }

  let payload: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxBodyBytes) {
      return errorResponse("INVALID_REQUEST", 413, requestId, false);
    }
    payload = JSON.parse(rawBody);
  } catch {
    return errorResponse("INVALID_REQUEST", 400, requestId, false);
  }

  const validation = parseFriendLinkApplication(payload);
  if (!validation.ok) {
    return errorResponse("INVALID_REQUEST", 400, requestId, false);
  }

  if (validation.value.honeypot) {
    return submittedResponse(requestId);
  }

  let rateLimitDecision;
  try {
    rateLimitDecision = await consumeFriendLinkRateLimit({
      clientKey: getClientKey(request),
      database: env.APP_DB,
      globalLimit: rateLimit.globalRequests,
      userLimit: rateLimit.userRequests,
      windowSeconds: rateLimit.windowSeconds,
    });
  } catch (error: unknown) {
    logEvent("error", "friend_link_rate_limit_error", requestId, {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return errorResponse("SERVICE_UNAVAILABLE", 503, requestId, true);
  }

  if (!rateLimitDecision.allowed) {
    logEvent("info", "friend_link_rate_limited", requestId, {
      globalCount: rateLimitDecision.globalCount,
      userCount: rateLimitDecision.userCount,
    });
    return errorResponse("RATE_LIMITED", 429, requestId, true);
  }

  try {
    const notionResponse = await fetch(notionApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": notionApiVersion,
      },
      body: JSON.stringify(
        buildNotionFriendLinkPagePayload({
          application: validation.value,
          databaseId,
          submittedAt: new Date().toISOString(),
        }),
      ),
      signal: AbortSignal.timeout(10_000),
    });

    if (!notionResponse.ok) {
      logEvent("error", "friend_link_notion_error", requestId, {
        status: notionResponse.status,
      });
      return errorResponse("UPSTREAM_ERROR", 502, requestId, true);
    }

    logEvent("info", "friend_link_submitted", requestId);
    return submittedResponse(requestId);
  } catch (error: unknown) {
    logEvent("error", "friend_link_submission_error", requestId, {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return errorResponse("UPSTREAM_ERROR", 502, requestId, true);
  }
}
