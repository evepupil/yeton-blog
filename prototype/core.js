(function createBlogAppCore() {
  "use strict";

  const Blog = globalThis.BlogPrototype;
  if (!Blog) {
    throw new Error("BlogPrototype content module is unavailable.");
  }

  const translations = {
    "zh-CN": {
      navHome: "首页",
      navPosts: "文章",
      navArchive: "归档",
      navBooks: "图书",
      navAbout: "关于",
      heroTitle: "写下代码之外，仍值得反复想的事。",
      heroDescription: "关于前端、AI 与独立开发，也记录一些慢下来的时刻。",
      readArticles: "阅读文章",
      browseArchive: "浏览归档",
      heroCaption: "保持好奇，持续交付。",
      profileName: "林墨",
      profileBio: "保持好奇，持续交付。",
      zhihuLabel: "知乎",
      featuredTitle: "近期文章",
      viewAll: "查看全部",
      postsTitle: "所有文章",
      postsDescription: "从工程实践到产品思考，按自己的节奏持续记录。",
      archiveTitle: "文章归档",
      archiveDescription: "按时间回看写过的主题与长期关注的问题。",
      topicTitle: "主题",
      booksTitle: "图书与长文",
      booksDescription: "把适合系统学习的内容整理成可以逐章阅读的书。",
      aboutTitle: "关于林墨",
      aboutLead: "独立开发者，也是一名长期写作者。",
      aboutP1:
        "我关注前端工程、AI 产品与 Serverless，也喜欢研究工具如何改变人的工作方式。",
      aboutP2:
        "这个博客用来保存可复用的经验、尚未想清楚的问题，以及那些值得慢慢完成的作品。",
      friendLinks: "朋友们",
      footerLine: "持续写作，保持清醒。",
      searchLabel: "全文搜索",
      searchTitle: "找一篇文章",
      aiTitle: "问问这个博客",
      aiWelcome:
        "你好，我可以根据博客文章帮你查找 Cloudflare、Next.js 和 AI 相关内容。",
    },
    en: {
      navHome: "Home",
      navPosts: "Writing",
      navArchive: "Archive",
      navBooks: "Books",
      navAbout: "About",
      heroTitle: "Notes on code, craft, and the questions worth revisiting.",
      heroDescription:
        "Frontend, AI and independent building, with room for slower observations.",
      readArticles: "Read writing",
      browseArchive: "Browse archive",
      heroCaption: "Stay curious. Keep shipping.",
      profileName: "Lin Mo",
      profileBio: "Stay curious. Keep shipping.",
      zhihuLabel: "Zhihu",
      featuredTitle: "Recent writing",
      viewAll: "View all",
      postsTitle: "All writing",
      postsDescription:
        "Engineering notes and product thinking, written at a sustainable pace.",
      archiveTitle: "Archive",
      archiveDescription:
        "A chronological view of recurring topics and unfinished questions.",
      topicTitle: "Topics",
      booksTitle: "Books and long reads",
      booksDescription:
        "Structured notes for subjects that deserve chapter-by-chapter reading.",
      aboutTitle: "About Lin Mo",
      aboutLead: "Independent builder and long-time writer.",
      aboutP1:
        "I work around frontend systems, AI products and Serverless, with a particular interest in how tools change the way people work.",
      aboutP2:
        "This blog keeps reusable field notes, unresolved questions and projects that are worth finishing slowly.",
      friendLinks: "Friends",
      footerLine: "Write consistently. Think clearly.",
      searchLabel: "Full-text search",
      searchTitle: "Find a post",
      aiTitle: "Ask the blog",
      aiWelcome:
        "Hi. I can help you find writing about Cloudflare, Next.js and AI.",
    },
  };

  const state = {
    locale: localStorage.getItem("prototype-locale") === "en" ? "en" : "zh-CN",
    theme:
      localStorage.getItem("prototype-theme") === "dark" ? "dark" : "light",
    postTag: "",
    archiveTag: "",
  };

  const elements = {
    articleDialog: document.querySelector("#article-dialog"),
    articleDialogContent: document.querySelector("#article-dialog-content"),
    articleGrid: document.querySelector("#article-grid"),
    archiveTags: document.querySelector("#archive-tags"),
    archiveTimeline: document.querySelector("#archive-timeline"),
    bookList: document.querySelector("#book-list"),
    homeFeatured: document.querySelector("#home-featured"),
    heroTags: document.querySelector("#hero-tags"),
    localeSelect: document.querySelector("#locale-select"),
    mobileMenu: document.querySelector("#mobile-nav"),
    mobileMenuButton: document.querySelector("#mobile-menu-button"),
    postCount: document.querySelector("#post-count"),
    postFilters: document.querySelector("#post-filters"),
    searchDialog: document.querySelector("#search-dialog"),
    searchInput: document.querySelector("#search-input"),
    searchResults: document.querySelector("#search-results"),
    themeButton: document.querySelector("#theme-button"),
    toast: document.querySelector("#toast"),
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value, formatLocale) {
    return new Intl.DateTimeFormat(formatLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  }

  function refreshIcons() {
    if (globalThis.lucide) {
      globalThis.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
    }
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      elements.toast.hidden = true;
    }, 2400);
  }
  showToast.timer = 0;

  function articleButton(article, className, label) {
    return `
      <button class="${className}" type="button" data-article-id="${escapeHtml(article.id)}">
        <span>${escapeHtml(label)}</span>
        <i data-lucide="arrow-up-right" aria-hidden="true"></i>
      </button>`;
  }

  function openDialog(dialog) {
    if (!dialog.open) {
      dialog.showModal();
    }
    document.body.classList.add("is-dialog-open");
  }

  function closeDialog(dialog) {
    if (dialog.open) {
      dialog.close();
    }
    if (!document.querySelector("dialog[open]")) {
      document.body.classList.remove("is-dialog-open");
    }
  }

  function routeTo(route) {
    const validRoutes = new Set(["home", "posts", "archive", "books", "about"]);
    const target = validRoutes.has(route) ? route : "home";

    document.querySelectorAll("[data-view]").forEach((view) => {
      const isActive = view.dataset.view === target;
      view.hidden = !isActive;
      view.classList.toggle("is-active", isActive);
    });

    document.querySelectorAll("[data-route]").forEach((link) => {
      const isActive = link.dataset.route === target;
      link.classList.toggle("is-active", isActive);
      if (link.closest(".desktop-nav, .mobile-nav")) {
        link.setAttribute("aria-current", isActive ? "page" : "false");
      }
    });

    elements.mobileMenu.hidden = true;
    elements.mobileMenuButton.setAttribute("aria-expanded", "false");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function updateLocale() {
    document.documentElement.lang = state.locale;
    elements.localeSelect.value = state.locale;
    const dictionary = translations[state.locale];
    document.querySelectorAll("[data-i18n-key]").forEach((element) => {
      const value = dictionary[element.dataset.i18nKey];
      if (value) {
        element.textContent = value;
      }
    });

    elements.searchInput.placeholder =
      state.locale === "en"
        ? "Search titles, topics and article text"
        : "搜索标题、标签与正文";
    document.querySelector("#ai-input").placeholder =
      state.locale === "en"
        ? "Try: How should I deploy to Pages?"
        : "例如：Cloudflare Pages 怎么部署？";
  }

  function updateTheme() {
    document.documentElement.dataset.theme = state.theme;
    const icon = elements.themeButton.querySelector("[data-lucide]");
    icon.dataset.lucide = state.theme === "dark" ? "sun" : "moon";
    elements.themeButton.setAttribute(
      "aria-label",
      state.theme === "dark" ? "切换浅色模式" : "切换深色模式",
    );
    document.querySelector('meta[name="theme-color"]').content =
      state.theme === "dark" ? "#151817" : "#ffffff";
    refreshIcons();
  }

  function highlight(value, query) {
    const safeValue = escapeHtml(value);
    const normalized = Blog.normalizeQuery(query);
    if (!normalized) {
      return safeValue;
    }
    const escapedQuery = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return safeValue.replace(
      new RegExp(`(${escapedQuery})`, "giu"),
      "<mark>$1</mark>",
    );
  }

  function findAiArticle(query) {
    const normalized = Blog.normalizeQuery(query);
    const aliases = [
      {
        words: ["cloudflare", "pages", "部署", "deploy"],
        id:
          state.locale === "en"
            ? "pages-field-notes-en"
            : "cloudflare-pages-nextjs",
      },
      {
        words: ["搜索", "search"],
        id: state.locale === "en" ? "search-notes-en" : "blog-search-design",
      },
      { words: ["ai", "写作", "writing"], id: "ai-writing-workflow" },
    ];
    const match = aliases.find((entry) =>
      entry.words.some((word) => normalized.includes(word)),
    );
    return match ? Blog.getArticleById(Blog.articles, match.id) : null;
  }

  globalThis.BlogAppCore = Object.freeze({
    Blog,
    articleButton,
    closeDialog,
    elements,
    escapeHtml,
    findAiArticle,
    formatDate,
    highlight,
    openDialog,
    refreshIcons,
    routeTo,
    showToast,
    state,
    updateLocale,
    updateTheme,
  });
})();
