import { Card } from "@heroui/react/card";
import { ArrowUpRight } from "lucide-react";

import { FriendAvatar } from "@/features/friends/friend-avatar";
import { friendsContent } from "@/features/friends/friends-content";
import type { FriendLink } from "@/lib/friends/schema";
import type { SiteLocale } from "@/lib/site-config";

interface FriendCardProps {
  readonly friend: FriendLink;
  readonly locale: SiteLocale;
}

export function FriendCard({ friend, locale }: FriendCardProps) {
  const content = friendsContent[locale];
  const hostname = new URL(friend.url).hostname.replace(/^www\./u, "");

  return (
    <a
      aria-label={content.visit(friend.name)}
      className="friend-card-link"
      href={friend.url}
      rel="noreferrer"
      target="_blank"
    >
      <Card.Root className="friend-card">
        <Card.Content className="friend-card-content">
          <FriendAvatar
            alt={content.avatarAlt(friend.name)}
            name={friend.name}
            src={friend.avatar}
          />
          <div className="friend-card-copy">
            <h2>{friend.name}</h2>
            <span className="friend-card-host">{hostname}</span>
            {friend.description ? (
              <Card.Description>{friend.description}</Card.Description>
            ) : null}
          </div>
          <ArrowUpRight aria-hidden="true" className="friend-card-arrow" />
        </Card.Content>
      </Card.Root>
    </a>
  );
}
