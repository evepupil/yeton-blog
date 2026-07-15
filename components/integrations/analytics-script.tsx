import Script from "next/script";

import { resolveUmamiConfig } from "@/lib/analytics/config";

export function AnalyticsScript() {
  const analytics = resolveUmamiConfig();
  if (!analytics) {
    return null;
  }

  return (
    <Script
      data-website-id={analytics.websiteId}
      src={analytics.scriptUrl}
      strategy="lazyOnload"
    />
  );
}
