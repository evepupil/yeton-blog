(function bootstrapBlogPrototype() {
  "use strict";

  const Core = globalThis.BlogAppCore;
  const Views = globalThis.BlogAppViews;
  if (!Core || !Views) {
    throw new Error("Blog application modules are unavailable.");
  }

  const {
    Blog,
    closeDialog,
    elements,
    findAiArticle,
    openDialog,
    refreshIcons,
    routeTo,
    showToast,
    state,
    updateLocale,
    updateTheme,
  } = Core;

  document.addEventListener("click", (event) => {
    const routeLink = event.target.closest("[data-route]");
    if (routeLink) {
      event.preventDefault();
      const topic = routeLink.dataset.topic;
      if (topic) {
        state.postTag = topic;
        Views.renderPostFilters();
        Views.renderPosts();
      }
      globalThis.location.hash = routeLink.dataset.route;
      routeTo(routeLink.dataset.route);
      refreshIcons();
      return;
    }

    const articleTrigger = event.target.closest("[data-article-id]");
    if (articleTrigger) {
      const article = Blog.getArticleById(
        Blog.articles,
        articleTrigger.dataset.articleId,
      );
      if (article) {
        if (elements.searchDialog.open) {
          closeDialog(elements.searchDialog);
        }
        Views.renderArticle(article);
      }
      return;
    }

    const postTag = event.target.closest("[data-post-tag]");
    if (postTag) {
      state.postTag = postTag.dataset.postTag;
      Views.renderPostFilters();
      Views.renderPosts();
      refreshIcons();
      return;
    }

    const archiveTag = event.target.closest("[data-archive-tag]");
    if (archiveTag) {
      state.archiveTag = archiveTag.dataset.archiveTag;
      Views.renderArchive();
      refreshIcons();
      return;
    }

    const chapter = event.target.closest("[data-chapter]");
    if (chapter) {
      showToast(
        `${state.locale === "en" ? "Opening" : "正在打开"}：${chapter.dataset.chapter}`,
      );
    }
  });

  document.querySelector("#search-button").addEventListener("click", () => {
    openDialog(elements.searchDialog);
    Views.renderSearchResults("");
    setTimeout(() => elements.searchInput.focus(), 0);
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () =>
      closeDialog(button.closest("dialog")),
    );
  });

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        closeDialog(dialog);
      }
    });
    dialog.addEventListener("close", () => {
      if (!document.querySelector("dialog[open]")) {
        document.body.classList.remove("is-dialog-open");
      }
    });
  });

  elements.searchInput.addEventListener("input", (event) => {
    Views.renderSearchResults(event.target.value);
  });

  elements.themeButton.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("prototype-theme", state.theme);
    updateTheme();
  });

  elements.localeSelect.addEventListener("change", (event) => {
    state.locale = event.target.value === "en" ? "en" : "zh-CN";
    state.postTag = "";
    state.archiveTag = "";
    localStorage.setItem("prototype-locale", state.locale);
    updateLocale();
    Views.renderAll();
  });

  elements.mobileMenuButton.addEventListener("click", () => {
    const willOpen = elements.mobileMenu.hidden;
    elements.mobileMenu.hidden = !willOpen;
    elements.mobileMenuButton.setAttribute("aria-expanded", String(willOpen));
  });

  document.querySelector("#friends-link").addEventListener("click", (event) => {
    event.preventDefault();
    showToast("友邻：Aster Notes · Mira Lab · North Studio");
  });

  document
    .querySelector("#article-dialog-content")
    .addEventListener("submit", (event) => {
      const form = event.target.closest("[data-comment-form]");
      if (!form) {
        return;
      }
      event.preventDefault();
      const input = form.elements.comment;
      const value = input.value.trim();
      if (!value) {
        return;
      }
      const item = document.createElement("div");
      item.className = "comment-item";
      item.textContent = value;
      form.parentElement.querySelector("[data-comment-list]").prepend(item);
      input.value = "";
      showToast(
        state.locale === "en"
          ? "Comment added to this preview."
          : "留言已加入本次预览。",
      );
    });

  const aiLauncher = document.querySelector("#ai-launcher");
  const aiPanel = document.querySelector("#ai-panel");
  const aiMessages = document.querySelector("#ai-messages");
  const aiInput = document.querySelector("#ai-input");

  aiLauncher.addEventListener("click", () => {
    aiPanel.hidden = false;
    aiLauncher.hidden = true;
    aiInput.focus();
  });

  document.querySelector("#ai-close").addEventListener("click", () => {
    aiPanel.hidden = true;
    aiLauncher.hidden = false;
  });

  document.querySelector("#ai-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const query = aiInput.value.trim();
    if (!query) {
      return;
    }

    const userMessage = document.createElement("div");
    userMessage.className = "ai-message user";
    userMessage.textContent = query;
    aiMessages.append(userMessage);
    aiInput.value = "";

    const article = findAiArticle(query);
    const assistantMessage = document.createElement("div");
    assistantMessage.className = "ai-message assistant";
    assistantMessage.textContent =
      state.locale === "en" ? "Searching the writing…" : "正在检索文章…";
    aiMessages.append(assistantMessage);
    aiMessages.scrollTop = aiMessages.scrollHeight;

    setTimeout(() => {
      if (article) {
        assistantMessage.textContent =
          state.locale === "en"
            ? `Start with “${article.title}”.`
            : `建议先读《${article.title}》。`;
        const source = document.createElement("a");
        source.href = "#";
        source.textContent =
          state.locale === "en" ? "Open source article" : "打开来源文章";
        source.addEventListener("click", (sourceEvent) => {
          sourceEvent.preventDefault();
          Views.renderArticle(article);
        });
        assistantMessage.append(source);
      } else {
        assistantMessage.textContent =
          state.locale === "en"
            ? "I could not find a close match. Try Cloudflare, search or AI writing."
            : "暂时没有找到贴近的问题。可以试试 Cloudflare、搜索或 AI 写作。";
      }
      aiMessages.scrollTop = aiMessages.scrollHeight;
    }, 520);
  });

  globalThis.addEventListener("hashchange", () => {
    routeTo(globalThis.location.hash.slice(1));
  });

  document.querySelector("#copyright-year").textContent = String(
    new Date().getFullYear(),
  );
  updateTheme();
  updateLocale();
  Views.renderAll();
  routeTo(globalThis.location.hash.slice(1) || "home");
  refreshIcons();
})();
