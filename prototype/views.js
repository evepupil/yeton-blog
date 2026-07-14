(function createBlogViews() {
  "use strict";

  const Core = globalThis.BlogAppCore;
  if (!Core) {
    throw new Error("BlogAppCore is unavailable.");
  }

  const {
    Blog,
    articleButton,
    elements,
    escapeHtml,
    formatDate,
    highlight,
    openDialog,
    refreshIcons,
    state,
  } = Core;

  function renderHome() {
    const localeArticles = Blog.filterArticles(Blog.articles, {
      locale: state.locale,
    });
    const featured = localeArticles.slice(0, 3);
    const tags = Blog.getTags(Blog.articles, state.locale).slice(0, 6);

    elements.heroTags.innerHTML = tags
      .map(
        (tag) => `
          <a class="hero-tag" href="#posts" data-route="posts" data-topic="${escapeHtml(tag.name)}">
            <span>#${escapeHtml(tag.name)}</span>
            <span>${tag.count}</span>
          </a>`,
      )
      .join("");

    if (featured.length === 0) {
      elements.homeFeatured.innerHTML = "";
      return;
    }

    const [primary, ...secondary] = featured;
    const readLabel = state.locale === "en" ? "Read post" : "阅读全文";
    elements.homeFeatured.innerHTML = `
      <article class="featured-primary">
        <img src="${escapeHtml(primary.image)}" alt="" width="1400" height="900" />
        <div class="featured-copy">
          <div>
            <div class="article-meta">
              <span class="meta-topic">${escapeHtml(primary.tags[0])}</span>
              <time datetime="${primary.published}">${formatDate(primary.published, state.locale)}</time>
              <span>${primary.readTime} MIN</span>
            </div>
            <h3>${escapeHtml(primary.title)}</h3>
            <p>${escapeHtml(primary.description)}</p>
          </div>
          ${articleButton(primary, "article-command", readLabel)}
        </div>
      </article>
      <div class="featured-secondary">
        ${secondary
          .map(
            (article) => `
              <article class="featured-small">
                <div>
                  <div class="article-meta">
                    <span class="meta-topic">${escapeHtml(article.tags[0])}</span>
                    <time datetime="${article.published}">${formatDate(article.published, state.locale)}</time>
                  </div>
                  <h3>${escapeHtml(article.title)}</h3>
                </div>
                ${articleButton(article, "article-command", readLabel)}
              </article>`,
          )
          .join("")}
      </div>`;
  }

  function renderPostFilters() {
    const tags = Blog.getTags(Blog.articles, state.locale).slice(0, 6);
    const allLabel = state.locale === "en" ? "All" : "全部";
    const options = [
      { name: "", label: allLabel },
      ...tags.map((tag) => ({ name: tag.name, label: tag.name })),
    ];

    if (!options.some((option) => option.name === state.postTag)) {
      state.postTag = "";
    }

    elements.postFilters.innerHTML = options
      .map(
        (option) => `
          <button class="filter-tab ${state.postTag === option.name ? "is-active" : ""}"
            type="button" role="tab" aria-selected="${state.postTag === option.name}"
            data-post-tag="${escapeHtml(option.name)}">${escapeHtml(option.label)}</button>`,
      )
      .join("");
  }

  function renderPosts() {
    const articles = Blog.filterArticles(Blog.articles, {
      locale: state.locale,
      tag: state.postTag,
    });
    const readLabel = state.locale === "en" ? "Read post" : "阅读全文";
    elements.postCount.textContent =
      state.locale === "en"
        ? `${articles.length} posts`
        : `共 ${articles.length} 篇`;

    if (articles.length === 0) {
      elements.articleGrid.innerHTML = `
        <div class="empty-state">
          <i data-lucide="file-search" aria-hidden="true"></i>
          <h2>${state.locale === "en" ? "No writing here yet" : "这个主题还没有文章"}</h2>
          <p>${state.locale === "en" ? "Try another topic." : "换一个主题继续看看。"}</p>
        </div>`;
      return;
    }

    elements.articleGrid.innerHTML = articles
      .map(
        (article) => `
          <article class="article-card">
            <img src="${escapeHtml(article.image)}" alt="" width="900" height="900" loading="lazy" />
            <div class="article-card-body">
              <div class="article-meta">
                <span class="meta-topic">${escapeHtml(article.tags[0])}</span>
                <time datetime="${article.published}">${formatDate(article.published, state.locale)}</time>
              </div>
              <h2>${escapeHtml(article.title)}</h2>
              <p>${escapeHtml(article.description)}</p>
              ${articleButton(article, "article-command", readLabel)}
            </div>
          </article>`,
      )
      .join("");
  }

  function renderArchive() {
    const localeArticles = Blog.filterArticles(Blog.articles, {
      locale: state.locale,
    });
    const tags = Blog.getTags(Blog.articles, state.locale);
    const allLabel = state.locale === "en" ? "All topics" : "全部主题";
    const options = [{ name: "", count: localeArticles.length }, ...tags];

    if (!options.some((tag) => tag.name === state.archiveTag)) {
      state.archiveTag = "";
    }

    elements.archiveTags.innerHTML = options
      .map(
        (tag) => `
          <button class="archive-tag ${state.archiveTag === tag.name ? "is-active" : ""}"
            type="button" data-archive-tag="${escapeHtml(tag.name)}">
            <span>${escapeHtml(tag.name || allLabel)}</span><span>${tag.count}</span>
          </button>`,
      )
      .join("");

    const filtered = Blog.filterArticles(Blog.articles, {
      locale: state.locale,
      tag: state.archiveTag,
    });
    const groups = Blog.groupArticlesByYear(filtered);
    elements.archiveTimeline.innerHTML = Object.keys(groups)
      .sort((a, b) => Number(b) - Number(a))
      .map(
        (year) => `
          <section class="archive-year">
            <h2>${year}</h2>
            ${groups[year]
              .map(
                (article) => `
                  <div class="archive-row">
                    <time datetime="${article.published}">${article.published.slice(5)}</time>
                    <button type="button" data-article-id="${escapeHtml(article.id)}">${escapeHtml(article.title)}</button>
                    <span>${escapeHtml(article.tags.slice(0, 2).join(" / "))}</span>
                  </div>`,
              )
              .join("")}
          </section>`,
      )
      .join("");
  }

  function renderBooks() {
    elements.bookList.innerHTML = Blog.books
      .map(
        (book, index) => `
          <article class="book-item">
            <div class="book-cover">
              <span>LINMO BOOK / 0${index + 1}</span>
              <strong>${escapeHtml(book.title)}</strong>
            </div>
            <div class="book-content">
              <div class="book-header">
                <h2>${escapeHtml(book.title)}</h2>
                <span class="book-status">${escapeHtml(book.status)}</span>
              </div>
              <p>${escapeHtml(book.description)}</p>
              <div class="book-progress">
                <div class="book-progress-track"><span style="width: ${book.progress}%"></span></div>
                <span>${book.progress}%</span>
              </div>
              <div class="chapter-list">
                ${book.chapters
                  .map(
                    (chapter) =>
                      `<button type="button" data-chapter="${escapeHtml(chapter)}">${escapeHtml(chapter)}</button>`,
                  )
                  .join("")}
              </div>
            </div>
          </article>`,
      )
      .join("");
  }

  function renderArticle(article) {
    const contentsLabel = state.locale === "en" ? "On this page" : "本文目录";
    const discussionLabel = state.locale === "en" ? "Discussion" : "讨论";
    const commentPlaceholder =
      state.locale === "en"
        ? "Leave a thoughtful note"
        : "写下一条有内容的留言";
    const submitLabel = state.locale === "en" ? "Post" : "发布";

    elements.articleDialogContent.innerHTML = `
      <header class="article-header">
        <div class="article-meta">
          <span class="meta-topic">${escapeHtml(article.tags.join(" / "))}</span>
          <time datetime="${article.published}">${formatDate(article.published, state.locale)}</time>
          <span>${article.wordCount} WORDS</span>
          <span>${article.readTime} MIN</span>
        </div>
        <h1 id="article-dialog-title">${escapeHtml(article.title)}</h1>
        <p>${escapeHtml(article.description)}</p>
      </header>
      <div class="article-layout">
        <article class="article-body">
          ${article.sections
            .map(
              (section) => `
                <section class="article-section" id="article-${escapeHtml(section.id)}">
                  <h2>${escapeHtml(section.title)}</h2>
                  ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
                </section>`,
            )
            .join("")}
          <section class="discussion">
            <h2>${discussionLabel}</h2>
            <form class="comment-form" data-comment-form>
              <label class="sr-only" for="comment-input">${commentPlaceholder}</label>
              <input id="comment-input" name="comment" required maxlength="180" placeholder="${commentPlaceholder}" />
              <button type="submit">${submitLabel}</button>
            </form>
            <div class="comment-list" data-comment-list></div>
          </section>
        </article>
        <aside class="article-toc" aria-label="${contentsLabel}">
          <strong>${contentsLabel}</strong>
          ${article.sections
            .map(
              (section) =>
                `<a href="#article-${escapeHtml(section.id)}">${escapeHtml(section.title)}</a>`,
            )
            .join("")}
        </aside>
      </div>`;

    openDialog(elements.articleDialog);
    refreshIcons();
  }

  function renderSearchResults(query) {
    const matches = Blog.filterArticles(Blog.articles, {
      locale: state.locale,
      query,
    }).slice(0, 6);

    if (!Blog.normalizeQuery(query)) {
      elements.searchResults.innerHTML = `<p class="empty-state">${
        state.locale === "en"
          ? "Search across titles, topics and full article text."
          : "输入关键词，搜索标题、标签与正文。"
      }</p>`;
      return;
    }

    if (matches.length === 0) {
      elements.searchResults.innerHTML = `<p class="empty-state">${
        state.locale === "en" ? "No matching writing." : "没有找到相关内容。"
      }</p>`;
      return;
    }

    elements.searchResults.innerHTML = matches
      .map(
        (article) => `
          <button class="search-result" type="button" data-article-id="${escapeHtml(article.id)}">
            <span>
              <h3>${highlight(article.title, query)}</h3>
              <p>${highlight(article.description, query)}</p>
            </span>
            <i data-lucide="arrow-up-right" aria-hidden="true"></i>
          </button>`,
      )
      .join("");
    refreshIcons();
  }

  function renderAll() {
    renderHome();
    renderPostFilters();
    renderPosts();
    renderArchive();
    renderBooks();
    refreshIcons();
  }

  globalThis.BlogAppViews = Object.freeze({
    renderAll,
    renderArchive,
    renderArticle,
    renderHome,
    renderPostFilters,
    renderPosts,
    renderSearchResults,
  });
})();
