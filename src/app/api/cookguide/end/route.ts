import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { endCookingSession } from "@/lib/services/cookguide";

const schema = z.object({
  sessionId: z.string().min(1),
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const session = await endCookingSession(user.id, parsed.data.sessionId);
  if (!session) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(session);
});
