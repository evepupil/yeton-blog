import friendLinksData from "@/data/friends.json";
import { friendLinksFileSchema, type FriendLink } from "@/lib/friends/schema";

export function parseFriendLinks(value: unknown): readonly FriendLink[] {
  return friendLinksFileSchema.parse(value).friends;
}

const friendLinks = parseFriendLinks(friendLinksData);

export function getFriendLinks(): readonly FriendLink[] {
  return friendLinks;
}
