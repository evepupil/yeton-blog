"use client";

import { Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { loadArticleStats } from "@/features/analytics/umami-client";
import { resolveUmamiConfig } from "@/lib/analytics/config";
import {
  getArticleAnalyticsPaths,
  type UmamiPageStats,
} from "@/lib/analytics/stats";
import type { SiteLocale } from "@/lib/site-config";

const analytics = resolveUmamiConfig();

type StatsState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly value: UmamiPageStats }
  | { readonly status: "unavailable" };

interface KeyedStatsState {
  readonly key: string;
  readonly state: StatsState;
}

const labels = {
  "zh-CN": {
    loading: "访问统计加载中",
    unavailable: "统计暂不可用",
    views: "浏览",
    visitors: "访客",
  },
  en: {
    loading: "Loading article statistics",
    unavailable: "Stats unavailable",
    views: "views",
    visitors: "visitors",
  },
} as const satisfies Record<SiteLocale, object>;

interface ArticleViewStatsProps {
  readonly compact?: boolean;
  readonly locale: SiteLocale;
  readonly slug: string;
}

export function ArticleViewStats({
  compact = false,
  locale,
  slug,
}: ArticleViewStatsProps) {
  const paths = useMemo(
    () => getArticleAnalyticsPaths(locale, slug),
    [locale, slug],
  );
  const pathsKey = paths.join("|");
  const [result, setResult] = useState<KeyedStatsState>(() => ({
    key: pathsKey,
    state: { status: "loading" },
  }));
  const state: StatsState =
    result.key === pathsKey ? result.state : { status: "loading" };
  const copy = labels[locale];

  useEffect(() => {
    if (!analytics?.pageViewsEnabled) return;

    let active = true;
    void loadArticleStats(paths).then(
      (value) => {
        if (active) {
          setResult({ key: pathsKey, state: { status: "ready", value } });
        }
      },
      () => {
        if (active) {
          setResult({ key: pathsKey, state: { status: "unavailable" } });
        }
      },
    );

    return () => {
      active = false;
    };
  }, [paths, pathsKey]);

  if (!analytics?.pageViewsEnabled) return null;

  let text: string = copy.loading;
  if (state.status === "unavailable") {
    text = copy.unavailable;
  } else if (state.status === "ready") {
    text = compact
      ? `${state.value.pageviews} ${copy.views}`
      : `${copy.views} ${state.value.pageviews} · ${copy.visitors} ${state.value.visitors}`;
  }

  return (
    <span
      aria-live={compact ? undefined : "polite"}
      className="article-view-stats"
      data-state={state.status}
      data-testid="article-view-stats"
      title={text}
    >
      <Eye aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
}
