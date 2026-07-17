import { ExternalScript } from "@/components/integrations/external-script";
import { GoogleAnalyticsPageViews } from "@/components/integrations/google-analytics-page-views";
import { resolveGoogleAnalyticsConfig } from "@/lib/analytics/config";

export function GoogleAnalyticsScript() {
  const analytics = resolveGoogleAnalyticsConfig();
  if (!analytics) return null;

  return (
    <>
      <ExternalScript
        id="blog-google-analytics-script"
        integration="google-analytics"
        src={analytics.scriptUrl}
      />
      <GoogleAnalyticsPageViews measurementId={analytics.measurementId} />
    </>
  );
}
