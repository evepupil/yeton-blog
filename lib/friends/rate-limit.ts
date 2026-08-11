import {
  consumeRateLimit,
  type ConsumeRateLimitOptions,
  type RateLimitDatabase,
  type RateLimitDecision,
} from "@/lib/rate-limit";

export type FriendLinkRateLimitDatabase = RateLimitDatabase;
export type FriendLinkRateLimitDecision = RateLimitDecision;

type FriendLinkRateLimitOptions = Omit<ConsumeRateLimitOptions, "namespace">;

export function consumeFriendLinkRateLimit(
  options: FriendLinkRateLimitOptions,
): Promise<FriendLinkRateLimitDecision> {
  return consumeRateLimit({ ...options, namespace: "friend-links" });
}
