import type { User } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-helpers";

type RouteContext<P> = { params: Promise<P> };
type AuthedHandler<P> = (
  req: Request,
  user: User,
  ctx: RouteContext<P>,
) => Promise<Response> | Response;

// Wraps a route handler with auth, passing the user as arg 2. req/ctx are optional so unit tests can call handlers directly; Next supplies both at runtime.
export function withAuth<P = Record<string, string>>(handler: AuthedHandler<P>) {
  return async (req?: Request, ctx?: RouteContext<P>): Promise<Response> => {
    const user = await requireAuth();
    if (user instanceof Response) return user;
    return handler(req as Request, user, ctx as RouteContext<P>);
  };
}
