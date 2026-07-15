// Public build-time settings only. Keep credentials and private API keys in environment variables.
export const supportedLocales = ["zh-CN", "en"] as const;

export type SiteLocale = (typeof supportedLocales)[number];
export type LocalizedText = Readonly<Record<SiteLocale, string>>;
export type SocialPlatform = "github" | "zhihu";

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
    readonly analytics: {
      readonly enabled: boolean;
      readonly provider: "cloudflare-web-analytics";
      readonly token: string;
    };
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
      "zh-CN": "独立开发者，也是一名长期写作者。",
      en: "Independent builder and long-time writer.",
    },
    aboutTitle: {
      "zh-CN": "关于林墨",
      en: "About Lin Mo",
    },
    avatar: {
      alt: {
        "zh-CN": "林墨的头像",
        en: "Lin Mo avatar",
      },
      src: "/images/profile-avatar.jpg",
    },
    bio: {
      "zh-CN": "保持好奇，持续交付。",
      en: "Stay curious. Keep shipping.",
    },
    homeTitle: {
      "zh-CN": "写下代码之外，仍值得反复想的事。",
      en: "Notes on code, craft, and the questions worth revisiting.",
    },
    name: {
      "zh-CN": "林墨",
      en: "Lin Mo",
    },
  },
  brand: {
    bookLabel: "LINMO BOOK",
    description: {
      "zh-CN": "关于前端、AI 与独立开发，也记录一些慢下来的时刻。",
      en: "Frontend, AI and independent building, with room for slower observations.",
    },
    footerLine: {
      "zh-CN": "持续写作，保持清醒。",
      en: "Write consistently. Think clearly.",
    },
    mark: "L",
    name: {
      "zh-CN": "林墨手记",
      en: "Linmo Notes",
    },
    socialImage: "/images/hero-workspace.jpg",
    wordmark: "LINMO NOTES",
  },
  copyrightYear: 2026,
  defaultLocale: "zh-CN",
  integrations: {
    adsense: {
      clientId: "",
      enabled: false,
    },
    analytics: {
      enabled: false,
      provider: "cloudflare-web-analytics",
      token: "",
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
      "zh-CN": "按年份查看林墨手记已经发布的文章。",
      en: "Browse all published writing by year.",
    },
    books: {
      "zh-CN": "查看林墨正在连载或已经完成的图书与长文。",
      en: "Books and long-form guides in progress or complete.",
    },
    posts: {
      "zh-CN": "按发布时间浏览林墨关于前端、AI 与独立开发的全部文章。",
      en: "Browse all notes on frontend engineering, AI and independent building.",
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
      enabled: false,
      href: "",
      label: { "zh-CN": "知乎", en: "Zhihu" },
      platform: "zhihu",
    },
  ],
} as const satisfies PublicSiteConfig;
