"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  articles,
  filterArticles,
  getArticleById,
  getTags,
  groupArticlesByYear,
  normalizeQuery,
} = require("../prototype/content.js");

test("normalizeQuery trims and normalizes case", () => {
  assert.equal(normalizeQuery("  CloudFlare  "), "cloudflare");
  assert.equal(normalizeQuery(null), "");
});

test("filterArticles keeps search results inside the selected locale", () => {
  const results = filterArticles(articles, {
    locale: "zh-CN",
    query: "Cloudflare",
  });

  assert.ok(results.length > 0);
  assert.ok(results.every((article) => article.locale === "zh-CN"));
  assert.ok(
    results.some((article) => article.id === "cloudflare-pages-nextjs"),
  );
});

test("filterArticles can match section body text and tags", () => {
  const bodyMatch = filterArticles(articles, {
    locale: "zh-CN",
    query: "全球 CDN",
  });
  const tagMatch = filterArticles(articles, {
    locale: "zh-CN",
    tag: "HeroUI",
  });

  assert.deepEqual(
    bodyMatch.map((article) => article.id),
    ["cloudflare-pages-nextjs"],
  );
  assert.deepEqual(
    tagMatch.map((article) => article.id),
    ["design-system-value"],
  );
});

test("groupArticlesByYear preserves every article", () => {
  const chineseArticles = filterArticles(articles, { locale: "zh-CN" });
  const groups = groupArticlesByYear(chineseArticles);
  const groupedCount = Object.values(groups).flat().length;

  assert.equal(groupedCount, chineseArticles.length);
  assert.ok(groups["2026"]);
  assert.ok(groups["2025"]);
});

test("getTags returns descending tag counts", () => {
  const tags = getTags(articles, "zh-CN");

  assert.ok(tags.length > 0);
  for (let index = 1; index < tags.length; index += 1) {
    assert.ok(tags[index - 1].count >= tags[index].count);
  }
});

test("getArticleById returns null for an unknown article", () => {
  assert.equal(getArticleById(articles, "missing"), null);
  assert.equal(
    getArticleById(articles, "blog-search-design")?.title,
    "个人博客的搜索，应该搜到什么",
  );
});
