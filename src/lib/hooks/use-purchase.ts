import { useCallback } from "react";
import { getPlatform, isNative } from "@/lib/capacitor";

export function usePurchase() {
  const platform = getPlatform();

  const purchase = useCallback(
    async (
      plan: string,
      interval: string,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!isNative()) {
        const res = await fetch("/api/stripe/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, interval }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          return { success: false, error: data?.error ?? "Checkout failed" };
        }
        const data = await res.json();
        window.location.href = data.url;
        return { success: true };
      }

      try {
        const { Purchases } = await import(
          "@revenuecat/purchases-capacitor"
        );
        const productId = `rv_${plan}_${interval}`;
        const { products } = await Purchases.getProducts({
          productIdentifiers: [productId],
        });
        if (!products.length) {
          return { success: false, error: "Product not found" };
        }
        await Purchases.purchaseStoreProduct({ product: products[0] });
        return { success: true };
      } catch (err: unknown) {
        const error = err as { userCancelled?: boolean; message?: string };
        if (error.userCancelled) return { success: false, error: "cancelled" };
        return { success: false, error: error.message ?? "Purchase failed" };
      }
    },
    [],
  );

  const restore = useCallback(async (): Promise<{ success: boolean }> => {
    if (!isNative()) return { success: false };
    try {
      const { Purchases } = await import(
        "@revenuecat/purchases-capacitor"
      );
      await Purchases.restorePurchases();
      return { success: true };
    } catch {
      return { success: false };
    }
  }, []);

  const manageSubscription = useCallback(async (): Promise<void> => {
    if (!isNative()) {
      const res = await fetch("/api/stripe/create-portal", {
        method: "POST",
      });
      if (!res.ok) return;
      const data = await res.json();
      window.location.href = data.url;
      return;
    }

    const url =
      platform === "ios"
        ? "https://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions";
    window.open(url, "_blank");
  }, []);

  return { purchase, restore, manageSubscription, platform };
}
