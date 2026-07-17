"use client";

import { Button } from "@heroui/react/button";
import { EmptyState } from "@heroui/react/empty-state";
import { Pagination } from "@heroui/react/pagination";
import { ChevronLeft, ChevronRight, FileSearch } from "lucide-react";
import { Fragment, useSyncExternalStore } from "react";

import { AdPlacement } from "@/features/monetization/ad-placement";
import { ArticleCard } from "@/features/posts/article-card";
import { postsContent } from "@/features/posts/posts-content";
import type { ArticlePreview, TagSummary } from "@/lib/content/types";
import type { ResolvedAdvertisement } from "@/lib/monetization/config";
import type { SiteLocale } from "@/lib/site-config";

const articlesPerPage = 10;
const locationChangeEvent = "blog:location-change";

function subscribeToLocation(onStoreChange: () => void) {
  const listener = () => onStoreChange();
  window.addEventListener("popstate", listener);
  window.addEventListener(locationChangeEvent, listener);

  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(locationChangeEvent, listener);
  };
}

function getLocationSearch() {
  return window.location.search;
}

function getServerSearch() {
  return "";
}

function updateLocation(tag: string, page: number) {
  const url = new URL(window.location.href);

  if (tag) {
    url.searchParams.set("tag", tag);
  } else {
    url.searchParams.delete("tag");
  }

  if (page > 1) {
    url.searchParams.set("page", String(page));
  } else {
    url.searchParams.delete("page");
  }

  window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new Event(locationChangeEvent));
}

interface ArticleBrowserProps {
  readonly advertisement: ResolvedAdvertisement | null;
  readonly articles: readonly ArticlePreview[];
  readonly locale: SiteLocale;
  readonly tags: readonly TagSummary[];
}

export function ArticleBrowser({
  advertisement,
  articles,
  locale,
  tags,
}: ArticleBrowserProps) {
  const content = postsContent[locale];
  const search = useSyncExternalStore(
    subscribeToLocation,
    getLocationSearch,
    getServerSearch,
  );
  const searchParams = new URLSearchParams(search);
  const requestedTag = searchParams.get("tag") ?? "";
  const selectedTag = tags.some((tag) => tag.name === requestedTag)
    ? requestedTag
    : "";
  const filteredArticles = selectedTag
    ? articles.filter((article) => article.tags.includes(selectedTag))
    : articles;
  const pageCount = Math.max(
    1,
    Math.ceil(filteredArticles.length / articlesPerPage),
  );
  const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), pageCount)
    : 1;
  const pageStart = (currentPage - 1) * articlesPerPage;
  const visibleArticles = filteredArticles.slice(
    pageStart,
    pageStart + articlesPerPage,
  );

  function selectTag(tag: string) {
    updateLocation(tag, 1);
  }

  function selectPage(page: number) {
    updateLocation(selectedTag, page);
    document
      .getElementById("article-results")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section aria-label={content.title} className="article-browser">
      <div className="content-toolbar">
        <div
          aria-label={locale === "en" ? "Filter by topic" : "按主题筛选"}
          className="filter-tabs"
        >
          <Button
            aria-pressed={!selectedTag}
            className={!selectedTag ? "is-active" : undefined}
            onPress={() => selectTag("")}
            size="sm"
            variant="ghost"
          >
            {content.allTopics}
          </Button>
          {tags.map((tag) => (
            <Button
              aria-pressed={selectedTag === tag.name}
              className={selectedTag === tag.name ? "is-active" : undefined}
              key={tag.name}
              onPress={() => selectTag(tag.name)}
              size="sm"
              variant="ghost"
            >
              {tag.name}
              <span>{tag.count}</span>
            </Button>
          ))}
        </div>
        <span aria-live="polite" className="result-count">
          {content.count(filteredArticles.length)}
        </span>
      </div>

      <div className="post-grid" id="article-results">
        {visibleArticles.length > 0 ? (
          visibleArticles.map((article, index) => (
            <Fragment key={article.slug}>
              <ArticleCard article={article} locale={locale} />
              {index === 1 ? (
                <AdPlacement advertisement={advertisement} locale={locale} />
              ) : null}
            </Fragment>
          ))
        ) : (
          <EmptyState className="posts-empty-state">
            <FileSearch aria-hidden="true" />
            <h2>{content.emptyTitle}</h2>
            <p>{content.emptyDescription}</p>
          </EmptyState>
        )}
      </div>

      {pageCount > 1 ? (
        <Pagination.Root
          aria-label={locale === "en" ? "Writing pages" : "文章分页"}
          className="posts-pagination"
        >
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                aria-label={content.previousPage}
                isDisabled={currentPage === 1}
                onPress={() => selectPage(currentPage - 1)}
              >
                <ChevronLeft aria-hidden="true" />
                <span>{content.previousPage}</span>
              </Pagination.Previous>
            </Pagination.Item>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map(
              (page) => (
                <Pagination.Item key={page}>
                  <Pagination.Link
                    aria-label={`${locale === "en" ? "Page" : "第"} ${page}`}
                    isActive={page === currentPage}
                    onPress={() => selectPage(page)}
                  >
                    {page}
                  </Pagination.Link>
                </Pagination.Item>
              ),
            )}
            <Pagination.Item>
              <Pagination.Next
                aria-label={content.nextPage}
                isDisabled={currentPage === pageCount}
                onPress={() => selectPage(currentPage + 1)}
              >
                <span>{content.nextPage}</span>
                <ChevronRight aria-hidden="true" />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination.Root>
      ) : null}
    </section>
  );
}
