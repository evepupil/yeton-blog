"use client";

import { Button } from "@heroui/react/button";
import { Spinner } from "@heroui/react/spinner";
import { MessageSquareText, RotateCw } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

import type { GiscusConfig } from "@/lib/giscus/config";
import type { SiteLocale } from "@/lib/site-config";

const commentsContent = {
  "zh-CN": {
    disabled: "评论暂未开放。",
    error: "评论暂时无法加载，正文阅读不受影响。",
    load: "加载评论",
    loading: "正在加载评论",
    retry: "重新加载",
    title: "评论",
  },
  en: {
    disabled: "Comments are not open yet.",
    error: "Comments could not load. The article remains available.",
    load: "Load comments",
    loading: "Loading comments",
    retry: "Try again",
    title: "Comments",
  },
} as const satisfies Record<SiteLocale, object>;

type CommentsStatus = "idle" | "loading" | "ready" | "error" | "disabled";

interface GiscusCommentsProps {
  readonly config: GiscusConfig | null;
  readonly locale: SiteLocale;
}

export function GiscusComments({ config, locale }: GiscusCommentsProps) {
  const content = commentsContent[locale];
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const initialTheme = useRef(theme);
  const hostRef = useRef<HTMLDivElement>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [status, setStatus] = useState<CommentsStatus>(
    config ? "idle" : "disabled",
  );

  useEffect(() => {
    if (!config || loadAttempt === 0) return;
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    const observer = new MutationObserver(() => {
      const frame = host.querySelector<HTMLIFrameElement>(
        "iframe.giscus-frame",
      );
      if (!frame) return;
      frame.addEventListener(
        "load",
        () => {
          if (!cancelled) setStatus("ready");
          clearTimeout(timeoutId);
        },
        { once: true },
      );
      observer.disconnect();
    });
    const fail = () => {
      if (cancelled) return;
      clearTimeout(timeoutId);
      observer.disconnect();
      host.replaceChildren();
      setStatus("error");
    };

    host.replaceChildren();
    setStatus("loading");
    observer.observe(host, { childList: true, subtree: true });

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.repo = config.repo;
    script.dataset.repoId = config.repoId;
    script.dataset.category = config.category;
    script.dataset.categoryId = config.categoryId;
    script.dataset.mapping = "pathname";
    script.dataset.strict = "1";
    script.dataset.reactionsEnabled = "1";
    script.dataset.emitMetadata = "0";
    script.dataset.inputPosition = "top";
    script.dataset.theme = initialTheme.current;
    script.dataset.lang = locale;
    script.dataset.loading = "lazy";
    script.addEventListener("error", fail, { once: true });
    const timeoutId = setTimeout(fail, 15_000);
    host.append(script);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      observer.disconnect();
      host.replaceChildren();
    };
  }, [config, loadAttempt, locale]);

  useEffect(() => {
    if (status !== "ready") return;
    const frame = hostRef.current?.querySelector<HTMLIFrameElement>(
      "iframe.giscus-frame",
    );
    frame?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme } } },
      "https://giscus.app",
    );
  }, [status, theme]);

  return (
    <section
      aria-labelledby="article-comments-title"
      className="article-comments"
      data-giscus-theme={theme}
      data-status={status}
      data-testid="article-comments"
    >
      <header className="article-comments-header">
        <MessageSquareText aria-hidden="true" />
        <h2 id="article-comments-title">{content.title}</h2>
      </header>

      {status === "disabled" ? (
        <p className="article-comments-message">{content.disabled}</p>
      ) : null}
      {status === "idle" ? (
        <Button
          onPress={() => setLoadAttempt((attempt) => attempt + 1)}
          size="sm"
          variant="outline"
        >
          <MessageSquareText aria-hidden="true" />
          {content.load}
        </Button>
      ) : null}
      {status === "loading" ? (
        <div aria-live="polite" className="article-comments-loading">
          <Spinner aria-label={content.loading} size="sm" />
          <span>{content.loading}</span>
        </div>
      ) : null}
      {status === "error" ? (
        <div aria-live="polite" className="article-comments-error">
          <p>{content.error}</p>
          <Button
            onPress={() => setLoadAttempt((attempt) => attempt + 1)}
            size="sm"
            variant="ghost"
          >
            <RotateCw aria-hidden="true" />
            {content.retry}
          </Button>
        </div>
      ) : null}

      <div className="article-comments-host" ref={hostRef} />
    </section>
  );
}
