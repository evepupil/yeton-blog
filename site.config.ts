// Public build-time settings only. Keep credentials and private API keys in environment variables.
export const supportedLocales = ["zh-CN", "en"] as const;

export type SiteLocale = (typeof supportedLocales)[number];
export type LocalizedText = Readonly<Record<SiteLocale, string>>;
export type SocialPlatform = "github" | "zhihu";

export interface UmamiAnalyticsConfig {
  readonly baseUrl: string;
  readonly enabled: boolean;
  readonly provider: "umami";
  readonly shareId: string;
  readonly websiteId: string;
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
    readonly adsense: {
      readonly clientId: string;
      readonly enabled: boolean;
    };
    readonly analytics: UmamiAnalyticsConfig;
    readonly comments: {
      readonly category: string;
      readonly categoryId: string;
      readonly enabled: boolean;
      readonly provider: "giscus";
      readonly repo: string;
      readonly repoId: string;
    };
  };
  readonly locales: readonly SiteLocale[];
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
        "这里记录 Serverless、AI 应用、前后端开发与独立项目实践。本站使用 Umami 做匿名访问统计，不使用 Cookie。",
      en: "Notes on serverless systems, AI applications, web development and independent projects. This site uses cookie-free Umami analytics.",
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
    adsense: {
      clientId: "ca-pub-1149581082118045",
      enabled: false,
    },
    analytics: {
      baseUrl: "https://cloud.umami.is",
      enabled: true,
      provider: "umami",
      shareId: "VOIhBeLJ4qp3otfX",
      websiteId: "526149f7-e7d5-40ac-ae75-50a0c2515abf",
    },
    comments: {
      category: "General",
      categoryId: "",
      enabled: false,
      provider: "giscus",
      repo: "evepupil/yeton-blog",
      repoId: "R_kgDOTY-rvQ",
    },
  },
  locales: supportedLocales,
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
