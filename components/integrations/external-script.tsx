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
    if (document.getElementById(id)) return;

    const script = document.createElement("script");
    script.async = true;
    script.dataset.blogIntegration = integration;
    script.id = id;
    script.src = src;
    if (crossOrigin) script.crossOrigin = crossOrigin;
    if (websiteId) script.dataset.websiteId = websiteId;

    script.addEventListener("error", () => script.remove(), { once: true });
    document.body.append(script);
  }, [crossOrigin, id, integration, src, websiteId]);

  return null;
}
