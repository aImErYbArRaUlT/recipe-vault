import { handlers } from "@/lib/auth";
import { rateLimit } from "@/lib/middleware/rate-limit";

const limit = rateLimit({ limit: 10, windowMs: 60_000 });

const originalPost = handlers.POST;

async function POST(...args: Parameters<typeof originalPost>) {
  const blocked = await limit("auth:nextauth");
  if (blocked) return blocked;
  return originalPost(...args);
}

const { GET } = handlers;
export { GET, POST };
