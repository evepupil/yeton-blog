import { siteConfig } from "@/site.config";
import type {
  AdPlacementConfig,
  AdPlacementName,
  AdvertisingConfig,
  SiteLocale,
  SponsorshipConfig,
} from "@/site.config";

const adsenseClientIdPattern = /^ca-pub-\d{16}$/u;
const adsenseSlotIdPattern = /^\d{6,20}$/u;

export interface ResolvedAdSensePlacement {
  readonly clientId: string;
  readonly name: AdPlacementName;
  readonly provider: "adsense";
  readonly slotId: string;
}

export interface ResolvedCustomAdvertisement {
  readonly description: string;
  readonly href: string;
  readonly image: {
    readonly alt: string;
    readonly src: string;
  } | null;
  readonly name: AdPlacementName;
  readonly provider: "custom";
  readonly title: string;
}

export type ResolvedAdvertisement =
  ResolvedAdSensePlacement | ResolvedCustomAdvertisement;

export interface ResolvedSponsorship {
  readonly available: boolean;
  readonly close: string;
  readonly description: string;
  readonly modalTitle: string;
  readonly qrCode: {
    readonly alt: string;
    readonly src: string;
  } | null;
  readonly title: string;
  readonly trigger: string;
  readonly unavailable: string;
}

function validateAdsenseClientId(clientId: string): void {
  if (!adsenseClientIdPattern.test(clientId)) {
    throw new Error(
      "AdSense client ID must use the ca-pub-################ format.",
    );
  }
}

function validateAdsenseSlotId(slotId: string, name: AdPlacementName): void {
  if (!adsenseSlotIdPattern.test(slotId)) {
    throw new Error(`AdSense slot for ${name} must contain only digits.`);
  }
}

function isSafeLocalImagePath(value: string): boolean {
  return (
    value.startsWith("/images/") &&
    !value.includes("..") &&
    !value.includes("\\")
  );
}

function isSafeAdvertisementHref(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return !value.includes("\\");
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function resolveCustomAdvertisement(
  name: AdPlacementName,
  locale: SiteLocale,
  placement: AdPlacementConfig,
): ResolvedCustomAdvertisement {
  const title = placement.custom.title[locale].trim();
  const description = placement.custom.description[locale].trim();
  const href = placement.custom.href.trim();
  const imageSrc = placement.custom.image.src.trim();
  const imageAlt = placement.custom.image.alt[locale].trim();

  if (!title) {
    throw new Error(`Custom advertisement title for ${name} is required.`);
  }
  if (!isSafeAdvertisementHref(href)) {
    throw new Error(
      `Custom advertisement href for ${name} must be an HTTPS or site-local URL.`,
    );
  }
  if (imageSrc && !isSafeLocalImagePath(imageSrc)) {
    throw new Error(
      `Custom advertisement image for ${name} must use a local /images/ path.`,
    );
  }
  if (imageSrc && !imageAlt) {
    throw new Error(`Custom advertisement image alt for ${name} is required.`);
  }

  return {
    description,
    href,
    image: imageSrc ? { alt: imageAlt, src: imageSrc } : null,
    name,
    provider: "custom",
    title,
  };
}

export function resolveAdPlacement(
  name: AdPlacementName,
  locale: SiteLocale,
  config: AdvertisingConfig = siteConfig.integrations.advertising,
): ResolvedAdvertisement | null {
  const placement = config.placements[name];
  if (!placement.enabled) {
    return null;
  }

  if (placement.provider === "custom") {
    return resolveCustomAdvertisement(name, locale, placement);
  }

  validateAdsenseClientId(config.adsenseClientId);
  validateAdsenseSlotId(placement.slotId, name);

  return {
    clientId: config.adsenseClientId,
    name,
    provider: "adsense",
    slotId: placement.slotId,
  };
}

export function resolveAdSenseClientId(
  config: AdvertisingConfig = siteConfig.integrations.advertising,
): string | null {
  const adsensePlacements = Object.entries(config.placements).filter(
    ([, placement]) => placement.enabled && placement.provider === "adsense",
  );
  if (adsensePlacements.length === 0) {
    return null;
  }

  validateAdsenseClientId(config.adsenseClientId);
  for (const [name, placement] of adsensePlacements) {
    validateAdsenseSlotId(placement.slotId, name as AdPlacementName);
  }

  return config.adsenseClientId;
}

function requireLocalizedCopy(value: string, field: string): string {
  const copy = value.trim();
  if (!copy) {
    throw new Error(`Sponsorship ${field} is required.`);
  }
  return copy;
}

export function resolveSponsorship(
  locale: SiteLocale,
  config: SponsorshipConfig = siteConfig.integrations.sponsorship,
): ResolvedSponsorship | null {
  if (!config.enabled) {
    return null;
  }

  const qrCodeSrc = config.qrCodeSrc.trim();
  if (qrCodeSrc && !isSafeLocalImagePath(qrCodeSrc)) {
    throw new Error("Sponsorship QR code must use a local /images/ path.");
  }

  return {
    available: Boolean(qrCodeSrc),
    close: requireLocalizedCopy(config.copy.close[locale], "close label"),
    description: requireLocalizedCopy(
      config.copy.description[locale],
      "description",
    ),
    modalTitle: requireLocalizedCopy(
      config.copy.modalTitle[locale],
      "modal title",
    ),
    qrCode: qrCodeSrc
      ? {
          alt: requireLocalizedCopy(config.copy.qrCodeAlt[locale], "QR alt"),
          src: qrCodeSrc,
        }
      : null,
    title: requireLocalizedCopy(config.copy.title[locale], "title"),
    trigger: requireLocalizedCopy(config.copy.trigger[locale], "trigger"),
    unavailable: requireLocalizedCopy(
      config.copy.unavailable[locale],
      "unavailable message",
    ),
  };
}
