import { z } from "zod";

export const friendLinkSchema = z.strictObject({
  name: z.string().trim().min(1),
  description: z.string().trim(),
  url: z.url().refine((value) => /^https?:\/\//u.test(value), {
    message: "friend URL must use http or https",
  }),
  avatar: z.string().trim().startsWith("/").optional(),
});

export const friendLinksFileSchema = z.strictObject({
  friends: z.array(friendLinkSchema),
});

export type FriendLink = z.infer<typeof friendLinkSchema>;
export type FriendLinksFile = z.infer<typeof friendLinksFileSchema>;
