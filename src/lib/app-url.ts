export function getAppUrl(): string {
  if (
    typeof window !== "undefined" &&
    !window.location.origin.startsWith("capacitor://")
  ) {
    return window.location.origin;
  }
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://simmer-app-production.up.railway.app"
  );
}
