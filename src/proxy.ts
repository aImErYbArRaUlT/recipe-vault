import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

type RouteUser = {
  subscriptionStatus?: string | null;
  planId?: string | null;
  trialEndsAt?: string | null;
} | null;

export type ProxyDecision =
  | { action: "next" }
  | { action: "redirect"; to: string };

// Pure routing decision, exported so it can be unit-tested without invoking NextAuth.
export function decideRoute(
  pathname: string,
  isLoggedIn: boolean,
  user: RouteUser,
): ProxyDecision {
  // "/" must be matched exactly; a prefix check would make every page public.
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route),
  );
  const isPublicRecipe = pathname.startsWith("/recipe/");
  if (isPublicRoute || isPublicRecipe) {
    return { action: "next" };
  }

  if (!isLoggedIn) {
    return { action: "redirect", to: "/login" };
  }

  // Pages an out-of-plan user must still reach to recover.
  const onRecoveryPath =
    pathname.startsWith("/subscribe") || pathname.startsWith("/settings/billing");

  // Redirect locked/expired subscriptions to recovery; free plan is allowed everywhere and AI is gated at the API layer.
  if (
    user?.subscriptionStatus === "locked" ||
    user?.subscriptionStatus === "expired"
  ) {
    if (!onRecoveryPath) {
      return { action: "redirect", to: "/subscribe" };
    }
  }

  return { action: "next" };
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = req.auth?.user as any;
  const decision = decideRoute(pathname, !!req.auth, user);
  if (decision.action === "redirect") {
    return NextResponse.redirect(new URL(decision.to, req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
