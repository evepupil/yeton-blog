import type { z } from "zod";

import {
  annualReadingStatsSchema,
  parseGatewayResponse,
  shelfSyncSchema,
  type AnnualReadingStats,
  type ShelfSync,
} from "./schema";

export const WEREAD_GATEWAY_URL = "https://i.weread.qq.com/api/agent/gateway";
export const WEREAD_SKILL_VERSION = "1.0.4";

interface WereadClientOptions {
  readonly apiKey: string;
  readonly fetcher?: typeof fetch;
}

async function requestGateway<T>(
  apiName: string,
  parameters: Readonly<Record<string, unknown>>,
  schema: z.ZodType<T>,
  options: WereadClientOptions,
): Promise<T> {
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(WEREAD_GATEWAY_URL, {
    body: JSON.stringify({
      api_name: apiName,
      ...parameters,
      skill_version: WEREAD_SKILL_VERSION,
    }),
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(
      `微信读书接口 ${apiName} 请求失败，HTTP ${response.status}`,
    );
  }

  const payload: unknown = await response.json();
  return parseGatewayResponse(payload, schema, apiName);
}

export function fetchAnnualReadingStats(
  options: WereadClientOptions,
): Promise<AnnualReadingStats> {
  return requestGateway(
    "/readdata/detail",
    { baseTime: 0, mode: "annually" },
    annualReadingStatsSchema,
    options,
  );
}

export function fetchShelf(options: WereadClientOptions): Promise<ShelfSync> {
  return requestGateway("/shelf/sync", {}, shelfSyncSchema, options);
}
