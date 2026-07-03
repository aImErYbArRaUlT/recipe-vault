import { Capacitor } from "@capacitor/core";

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): "ios" | "android" | "web" {
  return Capacitor.getPlatform() as "ios" | "android" | "web";
}

export async function initCapacitor() {
  if (!isNative()) return;

  const { StatusBar, Style } = await import("@capacitor/status-bar");
  const { SplashScreen } = await import("@capacitor/splash-screen");

  await StatusBar.setStyle({ style: Style.Dark }).catch(() => null);
  await SplashScreen.hide().catch(() => null);

  // Resize the web view when the on-screen keyboard appears so inputs
  // (cook chat, recipe forms, etc.) stay visible above it on iOS.
  try {
    const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    await Keyboard.setScroll({ isDisabled: false });
  } catch {
    /* Plugin not present on this build; safe to skip. */
  }
}

export async function initRevenueCat(userId: string) {
  if (!isNative()) return;

  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const platform = getPlatform();

    const apiKey =
      platform === "ios"
        ? (process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY ?? "")
        : (process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY ?? "");

    if (!apiKey) return;

    await Purchases.configure({ apiKey });
    await Purchases.logIn({ appUserID: userId });
  } catch {
    // RevenueCat not available (web build or plugin not installed)
  }
}
