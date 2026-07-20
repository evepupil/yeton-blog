"use client";

import { GitFork, Sparkles } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";

import type {
  AboutActivityStatus,
  GitHubContributionDay,
  GitHubContributionStatus,
  TokenBoardStatus,
} from "@/lib/about-status/types";
import type { SiteLocale } from "@/lib/site-config";

import { aboutContent } from "./about-content";

interface AboutActivityProps {
  readonly locale: SiteLocale;
}

function formatCount(value: number, locale: SiteLocale): string {
  if (value < 1_000) return new Intl.NumberFormat(locale).format(value);
  const units = [
    { divisor: 1_000_000_000, suffix: "B" },
    { divisor: 1_000_000, suffix: "M" },
    { divisor: 1_000, suffix: "K" },
  ];
  const unit = units.find(({ divisor }) => value >= divisor)!;
  const formatted = (value / unit.divisor).toFixed(1);
  return `${formatted.replace(/\.0$/u, "")}${unit.suffix}`;
}

function formatSource(source: string): string {
  return source
    .split(/[-_\s]+/u)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildWeeks(days: readonly GitHubContributionDay[]) {
  if (days.length === 0) return [];
  const firstDay = new Date(`${days[0]!.date}T00:00:00Z`).getUTCDay();
  const padded: Array<GitHubContributionDay | null> = [
    ...Array<null>(firstDay).fill(null),
    ...days,
  ];
  while (padded.length % 7 !== 0) padded.push(null);

  const weeks: Array<readonly (GitHubContributionDay | null)[]> = [];
  for (let index = 0; index < padded.length; index += 7) {
    weeks.push(padded.slice(index, index + 7));
  }
  return weeks;
}

function GithubHeatmap({
  locale,
  status,
}: {
  readonly locale: SiteLocale;
  readonly status: GitHubContributionStatus;
}) {
  const content = aboutContent[locale].activity;
  const weeks = buildWeeks(status.days);
  const hiddenWeekCount = Math.max(0, weeks.length - 26);

  return (
    <div className="about-heatmap-shell">
      <div
        aria-label={`${status.totalContributions} ${content.githubTitle}`}
        className="about-heatmap-weeks"
        role="img"
        style={{ "--about-heatmap-weeks": weeks.length } as CSSProperties}
      >
        {weeks.map((week, weekIndex) => (
          <div
            className={`about-heatmap-week${weekIndex < hiddenWeekCount ? " is-mobile-hidden" : ""}`}
            key={week.find(Boolean)?.date ?? `week-${weekIndex}`}
          >
            {week.map((day, dayIndex) =>
              day ? (
                <span
                  className={`about-heatmap-cell level-${day.level}`}
                  key={day.date}
                  title={`${day.date} · ${day.count}`}
                />
              ) : (
                <span aria-hidden="true" key={`empty-${dayIndex}`} />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TokenBoardBreakdown({
  locale,
  status,
}: {
  readonly locale: SiteLocale;
  readonly status: TokenBoardStatus;
}) {
  const content = aboutContent[locale].activity;
  const maxSource = Math.max(
    ...status.sourceSplit.map((item) => item.totalTokens),
    1,
  );

  return (
    <div className="about-token-breakdown">
      <div>
        <h4>{content.tokenSources}</h4>
        <div className="about-token-source-list">
          {status.sourceSplit.slice(0, 5).map((item) => (
            <div className="about-token-source" key={item.source}>
              <span>{formatSource(item.source)}</span>
              <i aria-hidden="true">
                <b
                  style={
                    {
                      "--about-token-share": `${(item.totalTokens / maxSource) * 100}%`,
                    } as CSSProperties
                  }
                />
              </i>
              <strong>{formatCount(item.totalTokens, locale)}</strong>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4>{content.tokenModels}</h4>
        <ol className="about-token-models">
          {status.topModels.slice(0, 4).map((item) => (
            <li key={item.model}>
              <span>{item.model}</span>
              <strong>{formatCount(item.totalTokens, locale)}</strong>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function AboutActivity({ locale }: AboutActivityProps) {
  const content = aboutContent[locale].activity;
  const [status, setStatus] = useState<AboutActivityStatus | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/about-status", {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("About status request failed.");
        return (await response.json()) as AboutActivityStatus;
      })
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoaded(true));

    return () => controller.abort();
  }, []);

  const primarySources = status?.tokenBoard?.sourceSplit
    .slice(0, 2)
    .map((item) => formatSource(item.source))
    .join(" · ");

  return (
    <section
      aria-labelledby="about-activity-title"
      className="about-activity-section shell"
    >
      <header className="about-section-heading">
        <div>
          <span className="section-index">01</span>
          <h2 id="about-activity-title">{content.heading}</h2>
        </div>
        <p>{loaded ? content.description : content.loading}</p>
      </header>

      <div aria-label={content.description} className="about-activity-summary">
        <div>
          <span>{content.githubActiveDays}</span>
          <strong>{status?.github?.activeDays ?? "—"}</strong>
        </div>
        <div>
          <span>{content.monthTokens}</span>
          <strong>
            {status?.tokenBoard
              ? formatCount(status.tokenBoard.monthTokens, locale)
              : "—"}
          </strong>
        </div>
        <div>
          <span>{content.primarySources}</span>
          <strong>{primarySources || "—"}</strong>
        </div>
      </div>

      <article
        aria-labelledby="github-activity-title"
        className="about-timeline-block"
      >
        <div className="about-chart-heading">
          <div>
            <h3 id="github-activity-title">
              <GitFork aria-hidden="true" />
              {content.githubTitle}
            </h3>
            <p>
              @{status?.github?.username ?? "evepupil"} · {content.githubPeriod}
            </p>
          </div>
          <div aria-label="Contribution level" className="about-heat-legend">
            <span>{content.less}</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <i className={`level-${level}`} key={level} />
            ))}
            <span>{content.more}</span>
          </div>
        </div>
        {!loaded ? (
          <div aria-hidden="true" className="about-chart-loading" />
        ) : status?.github ? (
          <GithubHeatmap locale={locale} status={status.github} />
        ) : (
          <p className="about-chart-empty">{content.githubEmpty}</p>
        )}
      </article>

      <article
        aria-labelledby="token-activity-title"
        className="about-timeline-block"
      >
        <div className="about-chart-heading">
          <div>
            <h3 id="token-activity-title">
              <Sparkles aria-hidden="true" />
              {content.tokenTitle}
            </h3>
            <p>TokenBoard · {content.monthTokens}</p>
          </div>
          {status?.tokenBoard ? (
            <dl className="about-token-totals">
              <div>
                <dt>{content.todayTokens}</dt>
                <dd>{formatCount(status.tokenBoard.todayTokens, locale)}</dd>
              </div>
              <div>
                <dt>{content.tokenTotal}</dt>
                <dd>{formatCount(status.tokenBoard.totalTokens, locale)}</dd>
              </div>
            </dl>
          ) : null}
        </div>
        {!loaded ? (
          <div
            aria-hidden="true"
            className="about-chart-loading about-token-loading"
          />
        ) : status?.tokenBoard ? (
          <TokenBoardBreakdown locale={locale} status={status.tokenBoard} />
        ) : (
          <p className="about-chart-empty">{content.tokenEmpty}</p>
        )}
      </article>
    </section>
  );
}
