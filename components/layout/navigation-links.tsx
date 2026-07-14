import { SiteLink } from "@/components/ui/site-link";
import { isNavigationItemActive } from "@/lib/navigation";
import type { NavigationItem } from "@/lib/navigation";

interface NavigationLinksProps {
  readonly items: readonly NavigationItem[];
  readonly onNavigate?: () => void;
  readonly pathname: string;
}

export function NavigationLinks({
  items,
  onNavigate,
  pathname,
}: NavigationLinksProps) {
  return items.map((item) => {
    const isActive = isNavigationItemActive(pathname, item.href);

    return (
      <SiteLink
        aria-current={isActive ? "page" : undefined}
        className={isActive ? "is-active" : undefined}
        href={item.href}
        key={item.key}
        onClick={onNavigate}
      >
        {item.label}
      </SiteLink>
    );
  });
}
