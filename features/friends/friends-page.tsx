import { EmptyState } from "@heroui/react/empty-state";
import { UsersRound } from "lucide-react";

import { PageIntro } from "@/components/page/page-intro";
import { FriendCard } from "@/features/friends/friend-card";
import { friendsContent } from "@/features/friends/friends-content";
import { getFriendLinks } from "@/lib/friends/repository";
import { getLocalizedSiteConfig } from "@/lib/site-config";
import type { SiteLocale } from "@/lib/site-config";

interface FriendsPageProps {
  readonly locale: SiteLocale;
}

export function FriendsPage({ locale }: FriendsPageProps) {
  const content = friendsContent[locale];
  const identity = getLocalizedSiteConfig(locale);
  const friends = getFriendLinks();

  return (
    <main className="shell friends-page">
      <PageIntro
        description={identity.sectionDescriptions.links}
        index="06"
        title={content.title}
      />

      <section aria-label={content.listLabel} className="friends-directory">
        <div className="friends-count">{content.count(friends.length)}</div>
        {friends.length > 0 ? (
          <div className="friends-grid">
            {friends.map((friend) => (
              <FriendCard friend={friend} key={friend.url} locale={locale} />
            ))}
          </div>
        ) : (
          <EmptyState className="friends-empty-state">
            <UsersRound aria-hidden="true" />
            <h2>{content.emptyTitle}</h2>
            <p>{content.emptyDescription}</p>
          </EmptyState>
        )}
      </section>
    </main>
  );
}
