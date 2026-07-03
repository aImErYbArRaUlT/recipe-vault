"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

export type Platform = "web" | "ios" | "android";

// Current runtime platform, resolved after mount to avoid hydration mismatch; used to branch UI for iOS native App Store quirks.
export function usePlatform(): { platform: Platform; isNativeIOS: boolean; mounted: boolean } {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const platform: Platform = mounted
    ? (Capacitor.getPlatform() as Platform)
    : "web";
  const isNativeIOS =
    mounted && Capacitor.isNativePlatform() && platform === "ios";

  return { platform, isNativeIOS, mounted };
}
