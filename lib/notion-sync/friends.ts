import type { PageObjectResponse } from "@notionhq/client";

import { friendLinkSchema, type FriendLink } from "@/lib/friends/schema";
import { readRichText, readTitle, readUrl } from "@/lib/notion-sync/properties";

export interface RemoteFriendLink extends Omit<FriendLink, "avatar"> {
  readonly avatarUrl?: string;
}

export function mapNotionFriend(page: PageObjectResponse): RemoteFriendLink {
  return friendLinkSchema
    .omit({ avatar: true })
    .extend({ avatarUrl: friendLinkSchema.shape.url.optional() })
    .parse({
      name: readTitle(page.properties, "网站名称"),
      description: readRichText(page.properties, "网站描述") ?? "",
      url: readUrl(page.properties, "网站地址"),
      avatarUrl: readUrl(page.properties, "头像URL"),
    });
}
