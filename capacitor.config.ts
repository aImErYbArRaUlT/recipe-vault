import type { CapacitorConfig } from "@capacitor/cli";

// HTTPS is required for production builds. Cleartext is only enabled when the
// app URL is unset (local development against http://localhost:3000) so the
// release IPA/AAB never ships with cleartext traffic allowed.
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const isCleartext = appUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "com.example.recipevault",
  appName: "Recipe Vault",
  server: {
    url: appUrl,
    cleartext: isCleartext,
  },
  ios: {
    scheme: "Recipe Vault",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
      backgroundColor: "#f7f2ea",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#f7f2ea",
    },
  },
};

export default config;
