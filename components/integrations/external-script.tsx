"use client";

import { useEffect } from "react";

interface ExternalScriptProps {
  readonly cfBeaconToken?: string;
  readonly crossOrigin?: "anonymous";
  readonly execution?: "async" | "defer";
  readonly id: string;
  readonly integration:
    "adsense" | "cloudflare-web-analytics" | "google-analytics" | "umami";
  readonly src: string;
  readonly websiteId?: string;
}

export function ExternalScript({
  cfBeaconToken,
  crossOrigin,
  execution = "async",
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
    script.async = execution === "async";
    script.defer = execution === "defer";
    script.dataset.blogIntegration = integration;
    script.dataset.loadStatus = "loading";
    script.id = id;
    script.src = src;
    if (crossOrigin) script.crossOrigin = crossOrigin;
    if (cfBeaconToken) {
      script.dataset.cfBeacon = JSON.stringify({ token: cfBeaconToken });
    }
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
  }, [cfBeaconToken, crossOrigin, execution, id, integration, src, websiteId]);

  return null;
}
