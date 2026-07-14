(function initBlogContent(root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.BlogPrototype = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createBlogContent() {
    "use strict";

    const articles = [
      {
        id: "cloudflare-pages-nextjs",
        title: "把 Next.js 博客稳稳部署到 Cloudflare Pages",
        description:
          "从静态导出、构建命令到缓存策略，记录一次真正可复用的部署过程。",
        published: "2026-07-10",
        updated: "2026-07-12",
        locale: "zh-CN",
        tags: ["Cloudflare", "Next.js", "部署"],
        readTime: 8,
        wordCount: 2680,
        pinned: true,
        image: "assets/article-network.jpg",
        sections: [
          {
            id: "why-pages",
            title: "为什么选 Pages",
            paragraphs: [
              "个人博客真正需要的是稳定、简单和容易迁移。Pages 的全球 CDN、自动 HTTPS 和 Git 集成正好覆盖了这三个要求。",
              "内容以静态页面为主时，访问速度和费用都很好控制。需要动态能力的部分，再交给 Pages Functions 单独处理。",
            ],
          },
          {
            id: "build-boundary",
            title: "先划清构建边界",
            paragraphs: [
              "文章、归档和标签页在构建时生成，搜索索引也跟着产出为 JSON。评论和 AI 问答需要运行时请求，放到独立接口里。",
              "这种拆法让大多数页面保持纯静态，也给以后增加动态功能留出了清晰位置。",
            ],
          },
          {
            id: "deploy-checklist",
            title: "上线前检查清单",
            paragraphs: [
              "确认 Node 版本、构建命令和输出目录一致；检查站点地图、RSS、404 页面和图片路径；最后用移动网络打开一篇长文章。",
              "部署成功只是开始。真正的完成标准，是读者从搜索结果进入页面后，能顺畅地阅读、跳转和继续探索。",
            ],
          },
        ],
      },
      {
        id: "blog-search-design",
        title: "个人博客的搜索，应该搜到什么",
        description:
          "标题匹配远远不够。标签、摘要、正文片段和语言范围共同决定搜索是否好用。",
        published: "2026-07-04",
        locale: "zh-CN",
        tags: ["搜索", "产品设计", "前端"],
        readTime: 6,
        wordCount: 1940,
        pinned: false,
        image: "assets/article-code.jpg",
        sections: [
          {
            id: "search-intent",
            title: "先理解搜索意图",
            paragraphs: [
              "读者常常只记得一个模糊词语。搜索需要同时覆盖标题、摘要、标签和正文片段，再把最接近的结果放在前面。",
              "当博客有多语言内容时，默认只搜索当前语言，可以明显减少无关结果。",
            ],
          },
          {
            id: "result-shape",
            title: "结果要给足判断信息",
            paragraphs: [
              "一个可用的结果至少包含标题、命中的正文片段、发布日期和标签。读者不用打开页面，就能判断它是否相关。",
            ],
          },
        ],
      },
      {
        id: "ai-writing-workflow",
        title: "把 AI 放进写作流程后，我保留了哪些手工步骤",
        description:
          "AI 可以整理资料和检查结构，但观点、取舍与最后一遍文字仍然值得亲手完成。",
        published: "2026-06-26",
        locale: "zh-CN",
        tags: ["AI", "写作", "工作流"],
        readTime: 7,
        wordCount: 2210,
        pinned: false,
        image: "assets/article-notes.jpg",
        sections: [
          {
            id: "collect",
            title: "资料整理交给机器",
            paragraphs: [
              "我会让 AI 先把零散资料归类，标出相互矛盾的地方，并保留原始链接。这个阶段追求的是完整，不急着下结论。",
            ],
          },
          {
            id: "judgement",
            title: "判断必须自己完成",
            paragraphs: [
              "哪些信息可信、哪些经验适合读者、哪些内容应该删掉，这些判断决定了文章有没有价值。",
            ],
          },
        ],
      },
      {
        id: "design-system-value",
        title: "设计系统真正省下了什么",
        description:
          "统一颜色和圆角只是表面，更重要的是减少每次做页面时反复争论的成本。",
        published: "2026-06-18",
        locale: "zh-CN",
        tags: ["设计系统", "HeroUI", "前端"],
        readTime: 5,
        wordCount: 1560,
        pinned: false,
        image: "assets/hero-workspace.jpg",
        sections: [
          {
            id: "shared-language",
            title: "先建立共同语言",
            paragraphs: [
              "当按钮、弹窗、列表和状态都有明确名字，设计与开发讨论问题会快很多。HeroUI 负责通用组件，博客自己的内容组件保持轻量。",
            ],
          },
          {
            id: "tokens",
            title: "让规则进入代码",
            paragraphs: [
              "颜色、间距和字号写成统一变量，深色模式与响应式调整才不会散落在每个页面里。",
            ],
          },
        ],
      },
      {
        id: "weekly-review",
        title: "一周结束时，我只复盘这三个问题",
        description:
          "少看完成数量，多看注意力去了哪里、哪些决定有效、下周该停止什么。",
        published: "2025-12-28",
        locale: "zh-CN",
        tags: ["随笔", "复盘"],
        readTime: 4,
        wordCount: 1180,
        pinned: false,
        image: "assets/article-notes.jpg",
        sections: [
          {
            id: "attention",
            title: "注意力去了哪里",
            paragraphs: [
              "时间记录只能说明我坐在电脑前多久，注意力记录才会告诉我真正推进了什么。",
            ],
          },
        ],
      },
      {
        id: "pages-field-notes-en",
        title: "Field notes from moving a blog to Cloudflare Pages",
        description:
          "A practical checklist for static output, redirects, assets and runtime boundaries.",
        published: "2026-07-09",
        locale: "en",
        tags: ["Cloudflare", "Next.js", "Deployment"],
        readTime: 7,
        wordCount: 1840,
        pinned: true,
        image: "assets/article-network.jpg",
        sections: [
          {
            id: "static-first",
            title: "Keep the static surface large",
            paragraphs: [
              "Posts, archives and feeds are excellent static pages. Reserve runtime code for features that truly need it, such as comments and AI search.",
            ],
          },
        ],
      },
      {
        id: "search-notes-en",
        title: "Search design for a small personal knowledge base",
        description:
          "Why snippets, tags and language-aware results matter more than a large search box.",
        published: "2026-06-21",
        locale: "en",
        tags: ["Search", "UX"],
        readTime: 5,
        wordCount: 1320,
        pinned: false,
        image: "assets/article-code.jpg",
        sections: [
          {
            id: "useful-results",
            title: "Make every result useful",
            paragraphs: [
              "Show enough context to let readers decide before they open a result: title, matched excerpt, date and topic.",
            ],
          },
        ],
      },
    ];

    const books = [
      {
        id: "ai-engineering",
        title: "AI 工程化学习路线",
        description:
          "从 Prompt、结构化输出到 Agent、RAG、评测和部署的系统学习笔记。",
        status: "连载中",
        progress: 67,
        chapters: [
          "01 / Prompt 与上下文",
          "02 / 结构化输出",
          "03 / Tool Calling",
          "04 / RAG 与检索",
          "05 / Agent 工作流",
          "06 / 评测与可观测性",
        ],
        tags: ["AI", "工程实践"],
      },
      {
        id: "indie-builder-notes",
        title: "独立开发手记",
        description: "关于选题、验证、设计、发布和长期维护的小型产品实践。",
        status: "已完结",
        progress: 100,
        chapters: [
          "01 / 从真实问题开始",
          "02 / 做出最小闭环",
          "03 / 发布前的减法",
          "04 / 让维护变得可持续",
        ],
        tags: ["产品", "独立开发"],
      },
    ];

    function normalizeQuery(value) {
      return String(value || "")
        .trim()
        .toLocaleLowerCase();
    }

    function filterArticles(items, options) {
      const settings = options || {};
      const query = normalizeQuery(settings.query);
      const tag = normalizeQuery(settings.tag);
      const locale = settings.locale || "zh-CN";

      return items.filter((article) => {
        if (article.locale !== locale) {
          return false;
        }

        const tagMatch =
          !tag || article.tags.some((item) => normalizeQuery(item) === tag);
        if (!tagMatch) {
          return false;
        }

        if (!query) {
          return true;
        }

        const sectionText = article.sections
          .flatMap((section) => [section.title, ...section.paragraphs])
          .join(" ");
        const haystack = normalizeQuery(
          [
            article.title,
            article.description,
            article.tags.join(" "),
            sectionText,
          ].join(" "),
        );

        return haystack.includes(query);
      });
    }

    function groupArticlesByYear(items) {
      return items.reduce((groups, article) => {
        const year = article.published.slice(0, 4);
        if (!groups[year]) {
          groups[year] = [];
        }
        groups[year].push(article);
        return groups;
      }, {});
    }

    function getTags(items, locale) {
      const counts = new Map();
      items
        .filter((article) => article.locale === locale)
        .forEach((article) => {
          article.tags.forEach((tag) => {
            counts.set(tag, (counts.get(tag) || 0) + 1);
          });
        });

      return Array.from(counts, ([name, count]) => ({ name, count })).sort(
        (a, b) => b.count - a.count || a.name.localeCompare(b.name),
      );
    }

    function getArticleById(items, id) {
      return items.find((article) => article.id === id) || null;
    }

    return Object.freeze({
      articles: Object.freeze(articles),
      books: Object.freeze(books),
      filterArticles,
      getArticleById,
      getTags,
      groupArticlesByYear,
      normalizeQuery,
    });
  },
);
