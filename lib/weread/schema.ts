import { z } from "zod";

const gatewayEnvelopeSchema = z
  .object({
    errcode: z.number().int().optional(),
    errmsg: z.string().optional(),
    upgrade_info: z.unknown().optional(),
  })
  .passthrough();

const readStatSchema = z
  .object({
    counts: z.string().optional(),
    stat: z.string(),
  })
  .passthrough();

export const annualReadingStatsSchema = z
  .object({
    readDays: z.number().int().nonnegative().optional(),
    readStat: z.array(readStatSchema).optional(),
    totalReadTime: z.number().finite().nonnegative().optional(),
  })
  .passthrough();

const shelfBookSchema = z
  .object({
    author: z.string().optional().default(""),
    cover: z.string().optional().default(""),
    finishReading: z.number().int().optional(),
    readUpdateTime: z.number().int().nonnegative().optional(),
    secret: z.number().int().optional(),
    title: z.string(),
  })
  .passthrough();

export const shelfSyncSchema = z
  .object({
    books: z.array(shelfBookSchema),
  })
  .passthrough();

export type AnnualReadingStats = z.infer<typeof annualReadingStatsSchema>;
export type ShelfBook = z.infer<typeof shelfBookSchema>;
export type ShelfSync = z.infer<typeof shelfSyncSchema>;

function readUpgradeMessage(value: unknown): string {
  const result = z
    .object({ message: z.string().trim().min(1) })
    .safeParse(value);
  return result.success ? result.data.message : "微信读书接口要求升级同步版本";
}

export function parseGatewayResponse<T>(
  value: unknown,
  schema: z.ZodType<T>,
  apiName: string,
): T {
  const envelope = gatewayEnvelopeSchema.parse(value);

  if (envelope.upgrade_info !== undefined && envelope.upgrade_info !== null) {
    throw new Error(readUpgradeMessage(envelope.upgrade_info));
  }

  if (envelope.errcode !== undefined && envelope.errcode !== 0) {
    const detail = envelope.errmsg?.trim() || "未提供错误信息";
    throw new Error(
      `微信读书接口 ${apiName} 返回错误 ${envelope.errcode}: ${detail}`,
    );
  }

  return schema.parse(value);
}
