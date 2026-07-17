import { ExternalScript } from "@/components/integrations/external-script";
import { resolveAdSenseClientId } from "@/lib/monetization/config";

export function AdSenseScript() {
  const clientId = resolveAdSenseClientId();
  if (!clientId) {
    return null;
  }

  return (
    <ExternalScript
      crossOrigin="anonymous"
      id="blog-adsense-script"
      integration="adsense"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
    />
  );
}
