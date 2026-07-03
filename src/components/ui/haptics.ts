"use client";

import { Capacitor } from "@capacitor/core";

type Intensity = "light" | "medium" | "heavy" | "select" | "success" | "warn" | "error";

let mod: typeof import("@capacitor/haptics") | null = null;

async function load() {
  if (!Capacitor.isNativePlatform()) return null;
  if (mod) return mod;
  mod = await import("@capacitor/haptics");
  return mod;
}

export async function haptic(intensity: Intensity = "light") {
  const m = await load();
  if (!m) return;
  const { Haptics, ImpactStyle, NotificationType } = m;
  try {
    switch (intensity) {
      case "light":
        await Haptics.impact({ style: ImpactStyle.Light });
        return;
      case "medium":
        await Haptics.impact({ style: ImpactStyle.Medium });
        return;
      case "heavy":
        await Haptics.impact({ style: ImpactStyle.Heavy });
        return;
      case "select":
        await Haptics.selectionChanged();
        return;
      case "success":
        await Haptics.notification({ type: NotificationType.Success });
        return;
      case "warn":
        await Haptics.notification({ type: NotificationType.Warning });
        return;
      case "error":
        await Haptics.notification({ type: NotificationType.Error });
        return;
    }
  } catch {
    /* swallow - haptics are best-effort */
  }
}
