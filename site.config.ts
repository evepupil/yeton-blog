// Public build-time settings only. Keep credentials and private API keys in environment variables.
export const supportedLocales = ["zh-CN", "en"] as const;

export type SiteLocale = (typeof supportedLocales)[number];
export type LocalizedText = Readonly<Record<SiteLocale, string>>;
export type SocialPlatform = "github" | "zhihu";
export type TechnologyStage = "adopt" | "assess" | "trial";

export type AdPlacementName = "article" | "home" | "posts";
export type AdvertisingProvider = "adsense" | "custom";

export interface CustomAdvertisementConfig {
  readonly description: LocalizedText;
  readonly href: string;
  readonly image: {
    readonly alt: LocalizedText;
    readonly src: string;
  };
  readonly title: LocalizedText;
}

export interface AdPlacementConfig {
  readonly custom: CustomAdvertisementConfig;
  readonly enabled: boolean;
  readonly provider: AdvertisingProvider;
  readonly slotId: string;
}

export interface AdvertisingConfig {
  readonly adsenseClientId: string;
  readonly placements: Readonly<Record<AdPlacementName, AdPlacementConfig>>;
}

export interface SponsorshipConfig {
  readonly copy: {
    readonly close: LocalizedText;
    readonly description: LocalizedText;
    readonly modalTitle: LocalizedText;
    readonly qrCodeAlt: LocalizedText;
    readonly title: LocalizedText;
    readonly trigger: LocalizedText;
    readonly unavailable: LocalizedText;
  };
  readonly enabled: boolean;
  readonly qrCodeSrc: string;
}

export interface UmamiAnalyticsConfig {
  readonly apiPath: string;
  readonly baseUrl: string;
  readonly enabled: boolean;
  readonly provider: "umami";
  readonly shareId: string;
  readonly showPageViews: boolean;
  readonly timezone: string;
  readonly websiteId: string;
}

export interface GoogleAnalyticsConfig {
  readonly enabled: boolean;
  readonly measurementId: string;
}

export interface CloudflareWebAnalyticsConfig {
  readonly enabled: boolean;
  readonly token: string;
}

export interface AiSearchConfig {
  readonly apiEndpoint: string;
  readonly autoragName: string;
  readonly enabled: boolean;
  readonly fallbackScoreThreshold: number;
  readonly maxCitations: number;
  readonly maxQueryLength: number;
  readonly maxRetrievalResults: number;
  readonly model: string;
  readonly rateLimit: {
    readonly globalRequests: number;
    readonly userRequests: number;
    readonly windowSeconds: number;
  };
  readonly requestTimeoutMs: number;
  readonly rerankerModel: string;
  readonly scoreThreshold: number;
}

export interface ProfileStatusConfig {
  readonly github: {
    readonly enabled: boolean;
    readonly username: string;
  };
  readonly reading: {
    readonly enabled: boolean;
    readonly profileUrl: string;
  };
  readonly technologyRadar: readonly {
    readonly name: string;
    readonly stage: TechnologyStage;
  }[];
  readonly tokenBoard: {
    readonly enabled: boolean;
    readonly publicJsonUrl: string;
  };
}

interface PublicSiteConfig {
  readonly author: {
    readonly about: LocalizedText;
    readonly aboutTitle: LocalizedText;
    readonly avatar: {
      readonly alt: LocalizedText;
      readonly src: string;
    };
    readonly bio: LocalizedText;
    readonly homeTitle: LocalizedText;
    readonly name: LocalizedText;
  };
  readonly brand: {
    readonly bookLabel: string;
    readonly description: LocalizedText;
    readonly footerLine: LocalizedText;
    readonly mark: string;
    readonly name: LocalizedText;
    readonly socialImage: string;
    readonly wordmark: string;
  };
  readonly copyrightYear: number;
  readonly defaultLocale: SiteLocale;
  readonly integrations: {
    readonly advertising: AdvertisingConfig;
    readonly aiSearch: AiSearchConfig;
    readonly analytics: UmamiAnalyticsConfig;
    readonly cloudflareWebAnalytics: CloudflareWebAnalyticsConfig;
    readonly comments: {
      readonly category: string;
      readonly categoryId: string;
      readonly enabled: boolean;
      readonly provider: "giscus";
      readonly repo: string;
      readonly repoId: string;
    };
    readonly googleAnalytics: GoogleAnalyticsConfig;
    readonly sponsorship: SponsorshipConfig;
  };
  readonly locales: readonly SiteLocale[];
  readonly profileStatus: ProfileStatusConfig;
  readonly sectionDescriptions: {
    readonly archives: LocalizedText;
    readonly books: LocalizedText;
    readonly links: LocalizedText;
    readonly posts: LocalizedText;
  };
  readonly socialLinks: readonly {
    readonly enabled: boolean;
    readonly href: string;
    readonly label: LocalizedText;
    readonly platform: SocialPlatform;
  }[];
}

export const siteConfig = {
  author: {
    about: {
      "zh-CN":
        "我关注 AI 工程化、Cloudflare、Web 开发与独立项目。比起写一份正式自传，我更想用持续更新的代码、阅读和创作记录，说明最近在做什么。",
      en: "I work around AI engineering, Cloudflare, web development and independent products. Rather than a formal biography, this page uses living records of code, reading and making to show what I have been doing lately.",
    },
    aboutTitle: {
      "zh-CN": "关于叶桐",
      en: "About Yeton",
    },
    avatar: {
      alt: {
        "zh-CN": "叶桐的头像",
        en: "Yeton avatar",
      },
      src: "/images/profile-avatar.jpg",
    },
    bio: {
      "zh-CN": "無くした日々にさよなら",
      en: "Saying goodbye to the days gone by.",
    },
    homeTitle: {
      "zh-CN": "技术探索与思维进化",
      en: "Exploring technology and evolving ideas",
    },
    name: {
      "zh-CN": "叶桐",
      en: "Yeton",
    },
  },
  brand: {
    bookLabel: "CHAOSYN BOOK",
    description: {
      "zh-CN":
        "分享 Serverless 架构、AI 应用开发、认知科学、学习方法与前后端技术实践。",
      en: "Serverless architecture, AI applications, cognitive science, learning methods and web engineering.",
    },
    footerLine: {
      "zh-CN": "技术探索与思维进化",
      en: "Exploring technology and evolving ideas",
    },
    mark: "C",
    name: {
      "zh-CN": "潮思Chaosyn",
      en: "Chaosyn",
    },
    socialImage: "/images/social-cover.jpg",
    wordmark: "CHAOSYN",
  },
  copyrightYear: 2026,
  defaultLocale: "zh-CN",
  integrations: {
    advertising: {
      adsenseClientId: "ca-pub-1149581082118045",
      placements: {
        article: {
          custom: {
            description: {
              "zh-CN": "面向技术读者展示你的产品、服务或开源项目。",
              en: "Introduce your product, service or open-source project to technical readers.",
            },
            href: "",
            image: {
              alt: { "zh-CN": "广告配图", en: "Advertisement artwork" },
              src: "",
            },
            title: { "zh-CN": "广告合作", en: "Advertise here" },
          },
          enabled: true,
          provider: "adsense",
          slotId: "6077231481",
        },
        home: {
          custom: {
            description: {
              "zh-CN": "面向技术读者展示你的产品、服务或开源项目。",
              en: "Introduce your product, service or open-source project to technical readers.",
            },
            href: "",
            image: {
              alt: { "zh-CN": "广告配图", en: "Advertisement artwork" },
              src: "",
            },
            title: { "zh-CN": "广告合作", en: "Advertise here" },
          },
          enabled: false,
          provider: "adsense",
          slotId: "6077231481",
        },
        posts: {
          custom: {
            description: {
              "zh-CN": "面向技术读者展示你的产品、服务或开源项目。",
              en: "Introduce your product, service or open-source project to technical readers.",
            },
            href: "",
            image: {
              alt: { "zh-CN": "广告配图", en: "Advertisement artwork" },
              src: "",
            },
            title: { "zh-CN": "广告合作", en: "Advertise here" },
          },
          enabled: false,
          provider: "adsense",
          slotId: "6077231481",
        },
      },
    },
    aiSearch: {
      apiEndpoint: "/api/ai-search",
      autoragName: "purple-rain-8860",
      enabled: true,
      fallbackScoreThreshold: 0.5,
      maxCitations: 5,
      maxQueryLength: 500,
      maxRetrievalResults: 15,
      model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      rateLimit: {
        globalRequests: 30,
        userRequests: 6,
        windowSeconds: 60,
      },
      requestTimeoutMs: 30_000,
      rerankerModel: "@cf/baai/bge-reranker-base",
      scoreThreshold: 0.3,
    },
    analytics: {
      apiPath: "/analytics/us/api/",
      baseUrl: "https://cloud.umami.is",
      enabled: true,
      provider: "umami",
      shareId: "VOIhBeLJ4qp3otfX",
      showPageViews: true,
      timezone: "Asia/Shanghai",
      websiteId: "526149f7-e7d5-40ac-ae75-50a0c2515abf",
    },
    cloudflareWebAnalytics: {
      enabled: true,
      token: "34ff13ae70884f10a32cf231fb228bfe",
    },
    comments: {
      category: "General",
      categoryId: "DIC_kwDOTY-rvc4DBSku",
      enabled: true,
      provider: "giscus",
      repo: "evepupil/yeton-blog",
      repoId: "R_kgDOTY-rvQ",
    },
    googleAnalytics: {
      enabled: true,
      measurementId: "G-D9ZRKT7G85",
    },
    sponsorship: {
      copy: {
        close: {
          "zh-CN": "关闭赞赏窗口",
          en: "Close sponsorship dialog",
        },
        description: {
          "zh-CN": "如果这篇文章帮到了你，可以请我喝杯咖啡，支持我继续写下去。",
          en: "If this article helped, you can support more independent writing.",
        },
        modalTitle: {
          "zh-CN": "微信赞赏",
          en: "Support via WeChat",
        },
        qrCodeAlt: {
          "zh-CN": "叶桐的微信收款二维码",
          en: "Yeton's WeChat payment QR code",
        },
        title: {
          "zh-CN": "喜欢这篇文章？",
          en: "Enjoyed this article?",
        },
        trigger: {
          "zh-CN": "微信赞赏",
          en: "Support this work",
        },
        unavailable: {
          "zh-CN": "赞赏暂未开放，感谢你的心意。",
          en: "Sponsorship is not open yet. Thank you for your support.",
        },
      },
      enabled: true,
      qrCodeSrc: "/images/sponsorship/wechat-qr.png",
    },
  },
  locales: supportedLocales,
  profileStatus: {
    github: {
      enabled: true,
      username: "evepupil",
    },
    reading: {
      enabled: true,
      profileUrl: "",
    },
    technologyRadar: [
      { name: "TypeScript", stage: "adopt" },
      { name: "Cloudflare", stage: "adopt" },
      { name: "Next.js", stage: "adopt" },
      { name: "AI Agent", stage: "trial" },
      { name: "RAG", stage: "trial" },
      { name: "MCP", stage: "trial" },
      { name: "D1", stage: "trial" },
      { name: "HonoX", stage: "assess" },
      { name: "Multi-agent", stage: "assess" },
    ],
    tokenBoard: {
      enabled: true,
      publicJsonUrl:
        "https://tokenboard.chaosyn.com/api/public/yeton-buvkzder.json",
    },
  },
  sectionDescriptions: {
    archives: {
      "zh-CN": "按年份查看潮思Chaosyn已经发布的文章。",
      en: "Browse all published writing by year.",
    },
    books: {
      "zh-CN": "查看叶桐正在连载或已经完成的图书与长文。",
      en: "Books and long-form guides in progress or complete.",
    },
    links: {
      "zh-CN": "在各自角落持续写作、创造与分享的人。",
      en: "People who keep writing, creating and sharing from their own corners of the web.",
    },
    posts: {
      "zh-CN": "按发布时间浏览 Serverless、Cloudflare、AI 与独立开发文章。",
      en: "Browse all writing on serverless systems, Cloudflare, AI and independent building.",
    },
  },
  socialLinks: [
    {
      enabled: true,
      href: "https://github.com/evepupil",
      label: { "zh-CN": "GitHub", en: "GitHub" },
      platform: "github",
    },
    {
      enabled: true,
      href: "https://www.zhihu.com/people/ye-tong-95-79",
      label: { "zh-CN": "知乎", en: "Zhihu" },
      platform: "zhihu",
    },
  ],
} as const satisfies PublicSiteConfig;
