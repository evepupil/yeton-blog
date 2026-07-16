import { describe, expect, it } from "vitest";

import {
  resolveAdPlacement,
  resolveAdSenseClientId,
  resolveSponsorship,
} from "../../lib/monetization/config";
import type {
  AdPlacementConfig,
  AdPlacementName,
  AdvertisingConfig,
  SponsorshipConfig,
} from "../../site.config";

function createPlacement(
  enabled = false,
  provider: AdPlacementConfig["provider"] = "adsense",
  href = "https://example.com/product",
): AdPlacementConfig {
  return {
    custom: {
      description: { "zh-CN": "广告说明", en: "Advertisement copy" },
      href,
      image: {
        alt: { "zh-CN": "产品截图", en: "Product screenshot" },
        src: "/images/advertisement.png",
      },
      title: { "zh-CN": "产品名称", en: "Product name" },
    },
    enabled,
    provider,
    slotId: "6077231481",
  };
}

function createAdvertisingConfig(
  options: {
    readonly clientId?: string;
    readonly placements?: Partial<
      Readonly<Record<AdPlacementName, AdPlacementConfig>>
    >;
  } = {},
): AdvertisingConfig {
  return {
    adsenseClientId: options.clientId ?? "ca-pub-1149581082118045",
    placements: {
      article: options.placements?.article ?? createPlacement(),
      home: options.placements?.home ?? createPlacement(),
      posts: options.placements?.posts ?? createPlacement(),
    },
  };
}

function createSponsorshipConfig(qrCodeSrc = ""): SponsorshipConfig {
  return {
    copy: {
      close: { "zh-CN": "关闭窗口", en: "Close dialog" },
      description: { "zh-CN": "支持继续写作", en: "Support more writing" },
      modalTitle: { "zh-CN": "微信赞赏", en: "Support via WeChat" },
      qrCodeAlt: { "zh-CN": "微信收款码", en: "WeChat payment code" },
      title: { "zh-CN": "喜欢这篇文章？", en: "Enjoyed this article?" },
      trigger: { "zh-CN": "微信赞赏", en: "Support this work" },
      unavailable: { "zh-CN": "暂未开放", en: "Not open yet" },
    },
    enabled: true,
    qrCodeSrc,
  };
}

describe("monetization configuration", () => {
  it("omits disabled placements and the AdSense script", () => {
    const config = createAdvertisingConfig();

    expect(resolveAdPlacement("home", "zh-CN", config)).toBeNull();
    expect(resolveAdSenseClientId(config)).toBeNull();
  });

  it("resolves an enabled AdSense placement", () => {
    const config = createAdvertisingConfig({
      placements: { home: createPlacement(true) },
    });

    expect(resolveAdPlacement("home", "zh-CN", config)).toEqual({
      clientId: "ca-pub-1149581082118045",
      name: "home",
      provider: "adsense",
      slotId: "6077231481",
    });
    expect(resolveAdSenseClientId(config)).toBe("ca-pub-1149581082118045");
  });

  it("rejects invalid enabled AdSense identifiers", () => {
    const config = createAdvertisingConfig({
      clientId: "pub-invalid",
      placements: { article: createPlacement(true) },
    });

    expect(() => resolveAdPlacement("article", "en", config)).toThrow(
      "AdSense client ID",
    );
  });

  it("resolves safe custom ads and rejects unsafe links", () => {
    const config = createAdvertisingConfig({
      placements: { posts: createPlacement(true, "custom") },
    });

    expect(resolveAdPlacement("posts", "zh-CN", config)).toMatchObject({
      href: "https://example.com/product",
      image: { src: "/images/advertisement.png" },
      provider: "custom",
      title: "产品名称",
    });

    const unsafeConfig = createAdvertisingConfig({
      placements: {
        posts: createPlacement(true, "custom", "javascript:alert(1)"),
      },
    });
    expect(() => resolveAdPlacement("posts", "zh-CN", unsafeConfig)).toThrow(
      "HTTPS or site-local URL",
    );
  });

  it("keeps sponsorship visible but unavailable until a QR code is set", () => {
    expect(
      resolveSponsorship("zh-CN", createSponsorshipConfig()),
    ).toMatchObject({
      available: false,
      qrCode: null,
      trigger: "微信赞赏",
    });
  });

  it("accepts only a local image for the payment QR code", () => {
    expect(
      resolveSponsorship(
        "en",
        createSponsorshipConfig("/images/sponsor/wechat.png"),
      ),
    ).toMatchObject({
      available: true,
      qrCode: { src: "/images/sponsor/wechat.png" },
    });
    expect(() =>
      resolveSponsorship(
        "en",
        createSponsorshipConfig("https://example.com/wechat.png"),
      ),
    ).toThrow("local /images/ path");
  });
});
