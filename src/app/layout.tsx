import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { SheetProvider } from "@/components/ui/sheet";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Allow pinch-zoom for accessibility (WCAG 1.4.4)
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#f7f2ea" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Recipe Vault · Your family cookbook, kept and cooked from",
    template: "%s · Recipe Vault",
  },
  description:
    "A living digital cookbook for the recipes that matter. Scan handwritten cards, preserve the original, and cook hands-free with an AI companion.",
  applicationName: "Recipe Vault",
  authors: [{ name: "Recipe Vault" }],
  icons: {
    // `app/icon.tsx` + `app/apple-icon.tsx` provide the dynamic icons; this list
    // adds a vector favicon for browsers that prefer SVG and keeps the legacy
    // raster fallbacks live.
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: "/apple-touch-icon.png",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Recipe Vault",
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    title: "Recipe Vault · Your family cookbook, kept and cooked from",
    description:
      "Scan handwritten cards, preserve the original, and cook hands-free with an AI companion.",
    siteName: "Recipe Vault",
    images: [{ url: "/logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Recipe Vault",
    description: "Your family cookbook, kept and cooked from.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${manrope.variable} antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-[var(--ink)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--ink-inverse)]"
        >
          Skip to main content
        </a>
        <SheetProvider>{children}</SheetProvider>
      </body>
    </html>
  );
}
