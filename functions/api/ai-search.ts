import {
  extractAutoRagSources,
  mapAutoRagCitations,
} from "../../lib/ai-search/citations";
import {
  isAllowedRequestOrigin,
  validateAiSearchQuery,
} from "../../lib/ai-search/request";
import {
  cleanupOldAiRateLimits,
  consumeAiRateLimit,
  type AiRateLimitDatabase,
} from "../../lib/ai-search/rate-limit";
import {
  encodeAiSearchEvent,
  flushSseRemainder,
  parseSseChunk,
} from "../../lib/ai-search/sse";
import type {
  AiSearchCitation,
  AiSearchErrorCode,
  AiSearchStreamEvent,
  SseFrame,
} from "../../lib/ai-search/types";
import {
  decodeAutoRagFrame,
  getAutoRagDelta,
  type AutoRagResponseMode,
} from "../../lib/ai-search/upstream";
import { siteConfig } from "../../site.config";

interface AutoRagRetrievalOptions {
  readonly max_num_results: number;
  readonly query: string;
  readonly ranking_options: {
    readonly score_threshold: number;
  };
  readonly reranking: {
    readonly enabled: true;
    readonly model: string;
  };
  readonly rewrite_query: true;
}

interface AutoRagAiSearchOptions extends AutoRagRetrievalOptions {
  readonly model: string;
  readonly stream: true;
}

interface AiBinding {
  autorag(name: string): {
    aiSearch(options: AutoRagAiSearchOptions): Promise<Response>;
    search(options: AutoRagRetrievalOptions): Promise<unknown>;
  };
}

export interface AiSearchEnv {
  readonly AI?: AiBinding;
  readonly AI_RATE_LIMIT_DB?: AiRateLimitDatabase;
}

interface PagesFunctionContext {
  readonly env: AiSearchEnv;
  readonly request: Request;
  readonly waitUntil?: (promise: Promise<unknown>) => void;
}

class UpstreamTimeoutError extends Error {}

const config = siteConfig.integrations.aiSearch;
const encoder = new TextEncoder();

function responseHeaders(requestId: string): Headers {
  return new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Request-ID": requestId,
  });
}

function errorResponse(
  code: AiSearchErrorCode,
  status: number,
  requestId: string,
  retryable: boolean,
): Response {
  const headers = responseHeaders(requestId);
  if (status === 429) headers.set("Retry-After", "60");

  return new Response(JSON.stringify({ code, requestId, retryable }), {
    headers,
    status,
  });
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new UpstreamTimeoutError("AI search timed out.")),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
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

function streamEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: AiSearchStreamEvent,
): void {
  controller.enqueue(encoder.encode(encodeAiSearchEvent(event)));
}

function createResponseStream(
  upstream: ReadableStream<Uint8Array>,
  initialCitations: readonly AiSearchCitation[],
  requestId: string,
): ReadableStream<Uint8Array> {
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let cancelled = false;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      reader = upstream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      let responseMode: AutoRagResponseMode = "unknown";
      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        void reader?.cancel("AI search stream timed out.");
      }, config.requestTimeoutMs);

      const processFrame = (frame: SseFrame): boolean => {
        const payload = decodeAutoRagFrame(frame);
        if (!payload) return true;
        if (payload.response === null) return true;

        const next = getAutoRagDelta(fullText, payload.response, responseMode);
        if (!next) return false;
        fullText = next.fullText;
        responseMode = next.mode;
        if (next.delta) {
          streamEvent(controller, {
            data: { text: next.delta },
            event: "delta",
          });
        }
        return true;
      };

      try {
        streamEvent(controller, {
          data: { citations: initialCitations },
          event: "citations",
        });

        while (!cancelled) {
          const result = await reader.read();
          if (result.done) break;

          const parsed = parseSseChunk(
            buffer,
            decoder.decode(result.value, { stream: true }),
          );
          buffer = parsed.remainder;
          if (!parsed.frames.every(processFrame)) {
            throw new Error("AutoRAG changed response formats mid-stream.");
          }
        }

        if (cancelled) return;
        if (timedOut) throw new UpstreamTimeoutError();

        buffer += decoder.decode();
        const finalFrame = flushSseRemainder(buffer);
        if (finalFrame && !processFrame(finalFrame)) {
          throw new Error("AutoRAG changed response formats mid-stream.");
        }

        if (!fullText.trim()) {
          const code = "UPSTREAM_ERROR";
          streamEvent(controller, {
            data: { code, requestId, retryable: true },
            event: "error",
          });
          controller.close();
          logEvent("error", "ai_search_incomplete", requestId, { code });
          return;
        }

        streamEvent(controller, {
          data: { requestId },
          event: "done",
        });
        controller.close();
        logEvent("info", "ai_search_complete", requestId, {
          citationCount: initialCitations.length,
        });
      } catch (error: unknown) {
        if (cancelled) return;
        const code = timedOut ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR";
        streamEvent(controller, {
          data: { code, requestId, retryable: true },
          event: "error",
        });
        controller.close();
        logEvent("error", "ai_search_stream_error", requestId, {
          code,
          reason: error instanceof Error ? error.name : "unknown",
        });
      } finally {
        clearTimeout(timeoutId);
        reader?.releaseLock();
      }
    },
    async cancel(reason) {
      cancelled = true;
      await reader?.cancel(reason);
    },
  });
}

export async function onRequestPost({
  env,
  request,
  waitUntil,
}: PagesFunctionContext): Promise<Response> {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  if (!isAllowedRequestOrigin(request)) {
    return errorResponse("ORIGIN_NOT_ALLOWED", 403, requestId, false);
  }
  if (!request.headers.get("Content-Type")?.includes("application/json")) {
    return errorResponse("INVALID_REQUEST", 415, requestId, false);
  }
  if (!env.AI || !env.AI_RATE_LIMIT_DB) {
    return errorResponse("SERVICE_UNAVAILABLE", 503, requestId, true);
  }

  let payload: unknown;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 4_096) {
      return errorResponse("INVALID_REQUEST", 413, requestId, false);
    }
    payload = JSON.parse(rawBody);
  } catch {
    return errorResponse("INVALID_REQUEST", 400, requestId, false);
  }

  const validation = validateAiSearchQuery(payload, config.maxQueryLength);
  if (!validation.ok) {
    return errorResponse(validation.code, 400, requestId, false);
  }

  try {
    const rateLimit = await consumeAiRateLimit({
      clientKey: getClientKey(request),
      database: env.AI_RATE_LIMIT_DB,
      globalLimit: config.rateLimit.globalRequests,
      userLimit: config.rateLimit.userRequests,
      windowSeconds: config.rateLimit.windowSeconds,
    });
    if (!rateLimit.allowed) {
      logEvent("info", "ai_search_rate_limited", requestId, {
        globalCount: rateLimit.globalCount,
        userCount: rateLimit.userCount,
      });
      return errorResponse("RATE_LIMITED", 429, requestId, true);
    }

    if (requestId.startsWith("00") && waitUntil) {
      waitUntil(
        cleanupOldAiRateLimits(env.AI_RATE_LIMIT_DB).catch((error: unknown) => {
          logEvent("error", "ai_search_rate_limit_cleanup_error", requestId, {
            reason: error instanceof Error ? error.name : "unknown",
          });
        }),
      );
    }

    const autorag = env.AI.autorag(config.autoragName);
    const retrievalOptions = {
      max_num_results: config.maxCitations,
      query: validation.query,
      ranking_options: {
        score_threshold: config.scoreThreshold,
      },
      reranking: {
        enabled: true,
        model: config.rerankerModel,
      },
      rewrite_query: true,
    } as const satisfies AutoRagRetrievalOptions;
    const searchResult = await withTimeout(
      autorag.search(retrievalOptions),
      config.requestTimeoutMs,
    );
    const citations = mapAutoRagCitations(
      extractAutoRagSources(searchResult),
      config.maxCitations,
    );
    if (citations.length === 0) {
      return errorResponse("NO_CITATIONS", 422, requestId, false);
    }

    const upstreamResponse = await withTimeout(
      autorag.aiSearch({
        ...retrievalOptions,
        model: config.model,
        stream: true,
      }),
      config.requestTimeoutMs,
    );

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      const code =
        upstreamResponse.status === 429 ? "RATE_LIMITED" : "UPSTREAM_ERROR";
      return errorResponse(
        code,
        upstreamResponse.status === 429 ? 429 : 502,
        requestId,
        true,
      );
    }

    const headers = responseHeaders(requestId);
    headers.set("Content-Type", "text/event-stream; charset=utf-8");
    headers.set("X-Accel-Buffering", "no");
    logEvent("info", "ai_search_started", requestId, {
      setupMs: Date.now() - startedAt,
    });

    return new Response(
      createResponseStream(upstreamResponse.body, citations, requestId),
      { headers },
    );
  } catch (error: unknown) {
    const timedOut = error instanceof UpstreamTimeoutError;
    const code = timedOut ? "UPSTREAM_TIMEOUT" : "SERVICE_UNAVAILABLE";
    logEvent("error", "ai_search_request_error", requestId, {
      code,
      reason: error instanceof Error ? error.name : "unknown",
    });
    return errorResponse(code, timedOut ? 504 : 503, requestId, true);
  }
}
