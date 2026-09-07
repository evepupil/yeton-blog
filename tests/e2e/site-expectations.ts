import { getReadingStatus } from "@/lib/about-status/reading";
import {
  getPublishedArticles,
  getPublishedArticlesByTag,
  getPublishedBooks,
  groupArticlesByYear,
} from "@/lib/content/queries";
import { loadArticles, loadBooks } from "@/lib/content/reader";
import type { Article } from "@/lib/content/types";

const articlesPerPage = 10;

function requireValue<T>(value: T | undefined, description: string): T {
  if (value === undefined) {
    throw new Error(`E2E content requires ${description}.`);
  }
  return value;
}

function toArticleExpectation(articles: readonly Article[], article: Article) {
  const index = articles.findIndex(
    (candidate) => candidate.slug === article.slug,
  );
  if (index < 0) {
    throw new Error(
      `Article ${article.slug} is missing from the published list.`,
    );
  }

  return {
    page: Math.floor(index / articlesPerPage) + 1,
    slug: article.slug,
    title: article.title,
  };
}

const expectationsPromise = Promise.all([loadArticles(), loadBooks()]).then(
  ([allArticles, allBooks]) => {
    const articles = getPublishedArticles(allArticles, "zh-CN");
    const books = getPublishedBooks(allBooks, "zh-CN");
    const aiArticles = getPublishedArticlesByTag(allArticles, "zh-CN", "AI");
    const homeArticle = requireValue(
      articles[0],
      "a published Chinese article",
    );
    const noCoverArticle = requireValue(
      articles.find((article) => !article.image),
      "a published Chinese article without a cover",
    );
    const coveredArticle = requireValue(
      articles.find((article) => article.image),
      "a published Chinese article with a cover",
    );
    const longestTitleArticle = requireValue(
      articles.toSorted(
        (left, right) => right.title.length - left.title.length,
      )[0],
      "a published Chinese article",
    );
    const untranslatedArticle = requireValue(
      articles.find((article) => !article.translationKey),
      "a published Chinese article without a translation",
    );
    const untranslatedBook = requireValue(
      books.find((book) => !book.translationKey),
      "a published Chinese book without a translation",
    );

    if (articles.length <= articlesPerPage) {
      throw new Error(
        "E2E pagination requires more than one page of articles.",
      );
    }
    if (aiArticles.length === 0) {
      throw new Error("E2E tag filtering requires a published AI article.");
    }

    return {
      aiArticleCount: aiArticles.length,
      articleCount: articles.length,
      archiveYears: [...groupArticlesByYear(articles).keys()],
      coveredArticle: toArticleExpectation(articles, coveredArticle),
      homeArticle: toArticleExpectation(articles, homeArticle),
      longestTitleArticle: toArticleExpectation(articles, longestTitleArticle),
      noCoverArticle: toArticleExpectation(articles, noCoverArticle),
      readingStatus: getReadingStatus(),
      secondPageCount: Math.min(
        articlesPerPage,
        articles.length - articlesPerPage,
      ),
      untranslatedArticle: toArticleExpectation(articles, untranslatedArticle),
      untranslatedBook: {
        slug: untranslatedBook.slug,
        title: untranslatedBook.title,
      },
    };
  },
);

export function getE2eContentExpectations() {
  return expectationsPromise;
}

export function getPostsPagePath(page: number): string {
  return page > 1 ? `/posts/?page=${page}` : "/posts/";
}

export function formatReadingMinutes(minutes: number): string {
  return `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分`;
}
