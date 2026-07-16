"use client";

import { useEffect, useRef } from "react";

interface AdSenseWindow extends Window {
  adsbygoogle?: Record<string, never>[];
}

interface AdSenseUnitProps {
  readonly clientId: string;
  readonly slotId: string;
}

export function AdSenseUnit({ clientId, slotId }: AdSenseUnitProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const adsenseWindow = window as AdSenseWindow;
    (adsenseWindow.adsbygoogle ??= []).push({});
  }, []);

  return (
    <ins
      className="adsbygoogle"
      data-ad-client={clientId}
      data-ad-format="auto"
      data-ad-slot={slotId}
      data-full-width-responsive="true"
    />
  );
}
