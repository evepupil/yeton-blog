"use client";

import { useEffect } from "react";

interface ExternalScriptProps {
  readonly crossOrigin?: "anonymous";
  readonly id: string;
  readonly integration: "adsense" | "google-analytics" | "umami";
  readonly src: string;
  readonly websiteId?: string;
}

export function ExternalScript({
  crossOrigin,
  id,
  integration,
  src,
  websiteId,
}: ExternalScriptProps) {
  useEffect(() => {
    const existingScript = document.getElementById(id);
    if (existingScript) {
      if (
        existingScript instanceof HTMLScriptElement &&
        existingScript.dataset.loadStatus === "error"
      ) {
        existingScript.remove();
      } else {
        return;
      }
    }

    const script = document.createElement("script");
    script.async = true;
    script.dataset.blogIntegration = integration;
    script.dataset.loadStatus = "loading";
    script.id = id;
    script.src = src;
    if (crossOrigin) script.crossOrigin = crossOrigin;
    if (websiteId) script.dataset.websiteId = websiteId;

    script.addEventListener(
      "load",
      () => {
        script.dataset.loadStatus = "loaded";
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => {
        script.dataset.loadStatus = "error";
      },
      { once: true },
    );
    document.body.append(script);
  }, [crossOrigin, id, integration, src, websiteId]);

  return null;
}
