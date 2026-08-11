import { z } from "zod";

const remoteHttpUrlSchema = z
  .string()
  .trim()
  .max(2_048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        (url.protocol === "http:" || url.protocol === "https:") &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, "URL must use http or https without embedded credentials.");

const optionalRemoteHttpUrlSchema = z
  .union([remoteHttpUrlSchema, z.literal("")])
  .optional()
  .transform((value) => value || undefined);

export const friendLinkApplicationSchema = z.strictObject({
  avatar: optionalRemoteHttpUrlSchema,
  description: z.string().trim().min(1).max(240),
  honeypot: z.string().trim().max(100).optional().default(""),
  name: z.string().trim().min(1).max(80),
  url: remoteHttpUrlSchema,
});

export type FriendLinkApplication = z.infer<typeof friendLinkApplicationSchema>;

export type FriendLinkApplicationErrorCode =
  | "INVALID_REQUEST"
  | "ORIGIN_NOT_ALLOWED"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "SUBMITTED"
  | "UPSTREAM_ERROR";

export type FriendLinkApplicationFailureCode = Exclude<
  FriendLinkApplicationErrorCode,
  "SUBMITTED"
>;

export type FriendLinkApplicationValidation =
  | { readonly ok: true; readonly value: FriendLinkApplication }
  | { readonly ok: false };

export function parseFriendLinkApplication(
  value: unknown,
): FriendLinkApplicationValidation {
  const result = friendLinkApplicationSchema.safeParse(value);
  return result.success ? { ok: true, value: result.data } : { ok: false };
}

export interface NotionFriendLinkPagePayload {
  readonly parent: { readonly database_id: string };
  readonly properties: Readonly<Record<string, unknown>>;
}

export function buildNotionFriendLinkPagePayload({
  application,
  databaseId,
  submittedAt,
}: {
  readonly application: FriendLinkApplication;
  readonly databaseId: string;
  readonly submittedAt: string;
}): NotionFriendLinkPagePayload {
  return {
    parent: { database_id: databaseId },
    properties: {
      网站名称: {
        title: [{ text: { content: application.name } }],
      },
      网站地址: { url: application.url },
      网站描述: {
        rich_text: [{ text: { content: application.description } }],
      },
      头像URL: { url: application.avatar ?? null },
      状态: { select: { name: "待审核" } },
      提交时间: { date: { start: submittedAt } },
    },
  };
}
