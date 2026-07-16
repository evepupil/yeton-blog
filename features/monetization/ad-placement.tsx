import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { AdSenseUnit } from "@/features/monetization/adsense-unit";
import type { ResolvedAdvertisement } from "@/lib/monetization/config";
import type { SiteLocale } from "@/lib/site-config";

const advertisementLabel = {
  "zh-CN": "广告",
  en: "Advertisement",
} as const satisfies Record<SiteLocale, string>;

interface AdPlacementProps {
  readonly advertisement: ResolvedAdvertisement | null;
  readonly locale: SiteLocale;
}

export function AdPlacement({ advertisement, locale }: AdPlacementProps) {
  if (!advertisement) {
    return null;
  }

  const label = advertisementLabel[locale];

  return (
    <aside
      aria-label={label}
      className={`ad-placement ad-placement-${advertisement.name}`}
      data-ad-provider={advertisement.provider}
    >
      <span className="ad-disclosure">{label}</span>
      {advertisement.provider === "adsense" ? (
        <AdSenseUnit
          clientId={advertisement.clientId}
          slotId={advertisement.slotId}
        />
      ) : (
        <a
          className={`custom-ad${advertisement.image ? " has-image" : ""}`}
          href={advertisement.href}
          rel="nofollow sponsored noreferrer"
          target={advertisement.href.startsWith("/") ? undefined : "_blank"}
        >
          {advertisement.image ? (
            <span className="custom-ad-image">
              <Image
                alt={advertisement.image.alt}
                fill
                sizes="160px"
                src={advertisement.image.src}
              />
            </span>
          ) : null}
          <span className="custom-ad-copy">
            <strong>{advertisement.title}</strong>
            {advertisement.description ? (
              <span>{advertisement.description}</span>
            ) : null}
          </span>
          <ArrowUpRight aria-hidden="true" />
        </a>
      )}
    </aside>
  );
}
