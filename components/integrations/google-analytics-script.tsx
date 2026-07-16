import Script from "next/script";

import { GoogleAnalyticsPageViews } from "@/components/integrations/google-analytics-page-views";
import { resolveGoogleAnalyticsConfig } from "@/lib/analytics/config";

export function GoogleAnalyticsScript() {
  const analytics = resolveGoogleAnalyticsConfig();
  if (!analytics) return null;

  return (
    <>
      <Script src={analytics.scriptUrl} strategy="lazyOnload" />
      <GoogleAnalyticsPageViews measurementId={analytics.measurementId} />
    </>
  );
}
