import Script from "next/script";

import { resolveAdSenseClientId } from "@/lib/monetization/config";

export function AdSenseScript() {
  const clientId = resolveAdSenseClientId();
  if (!clientId) {
    return null;
  }

  return (
    <Script
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      strategy="lazyOnload"
    />
  );
}
