import { ExternalScript } from "@/components/integrations/external-script";
import { resolveCloudflareWebAnalyticsConfig } from "@/lib/analytics/config";

export function CloudflareWebAnalyticsScript() {
  const analytics = resolveCloudflareWebAnalyticsConfig();
  if (!analytics) return null;

  return (
    <ExternalScript
      cfBeaconToken={analytics.token}
      execution="defer"
      id="blog-cloudflare-web-analytics-script"
      integration="cloudflare-web-analytics"
      src={analytics.scriptUrl}
    />
  );
}
