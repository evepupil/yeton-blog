import { ExternalScript } from "@/components/integrations/external-script";
import { resolveUmamiConfig } from "@/lib/analytics/config";

export function AnalyticsScript() {
  const analytics = resolveUmamiConfig();
  if (!analytics) {
    return null;
  }

  return (
    <ExternalScript
      id="blog-umami-script"
      integration="umami"
      src={analytics.scriptUrl}
      websiteId={analytics.websiteId}
    />
  );
}
