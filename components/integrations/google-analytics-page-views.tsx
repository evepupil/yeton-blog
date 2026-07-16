"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

interface GoogleAnalyticsWindow extends Window {
  blogGoogleAnalyticsInitialized?: boolean;
  dataLayer?: unknown[];
  gtag?: (...values: unknown[]) => void;
}

interface GoogleAnalyticsPageViewsProps {
  readonly measurementId: string;
}

export function GoogleAnalyticsPageViews({
  measurementId,
}: GoogleAnalyticsPageViewsProps) {
  const pathname = usePathname();

  useEffect(() => {
    const analyticsWindow = window as GoogleAnalyticsWindow;
    analyticsWindow.dataLayer ??= [];
    analyticsWindow.gtag ??= function gtag() {
      // Google tag's command queue expects the function's Arguments object.
      // eslint-disable-next-line prefer-rest-params
      analyticsWindow.dataLayer?.push(arguments);
    };
    if (!analyticsWindow.blogGoogleAnalyticsInitialized) {
      analyticsWindow.blogGoogleAnalyticsInitialized = true;
      analyticsWindow.gtag("consent", "default", {
        ad_personalization: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        analytics_storage: "denied",
      });
      analyticsWindow.gtag("js", new Date());
      analyticsWindow.gtag("config", measurementId, {
        send_page_view: false,
      });
    }
    analyticsWindow.gtag("event", "page_view", {
      page_location: window.location.href,
      page_path: pathname,
      page_title: document.title,
      send_to: measurementId,
    });
  }, [measurementId, pathname]);

  return null;
}
