import { Card } from "@heroui/react/card";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { SiteLink } from "@/components/ui/site-link";
import { getPostHref } from "@/features/posts/post-links";
import type { ArticleNavigation as ArticleNavigationData } from "@/lib/content/types";

interface ArticleNavigationProps {
  readonly ariaLabel: string;
  readonly labels: {
    readonly next: string;
    readonly previous: string;
  };
  readonly navigation: ArticleNavigationData;
}

export function ArticleNavigation({
  ariaLabel,
  labels,
  navigation,
}: ArticleNavigationProps) {
  if (!navigation.previous && !navigation.next) {
    return null;
  }

  return (
    <nav aria-label={ariaLabel} className="article-navigation">
      {navigation.previous ? (
        <Card.Root className="article-navigation-card">
          <Card.Content>
            <span>
              <ArrowLeft aria-hidden="true" />
              {labels.previous}
            </span>
            <Card.Title>
              <SiteLink
                href={getPostHref(
                  navigation.previous.locale,
                  navigation.previous.slug,
                )}
              >
                {navigation.previous.title}
              </SiteLink>
            </Card.Title>
          </Card.Content>
        </Card.Root>
      ) : (
        <span aria-hidden="true" />
      )}
      {navigation.next ? (
        <Card.Root className="article-navigation-card is-next">
          <Card.Content>
            <span>
              {labels.next}
              <ArrowRight aria-hidden="true" />
            </span>
            <Card.Title>
              <SiteLink
                href={getPostHref(navigation.next.locale, navigation.next.slug)}
              >
                {navigation.next.title}
              </SiteLink>
            </Card.Title>
          </Card.Content>
        </Card.Root>
      ) : null}
    </nav>
  );
}
