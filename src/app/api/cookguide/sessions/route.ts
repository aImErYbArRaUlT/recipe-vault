import { withAuth } from "@/lib/middleware/with-auth";
import { listCookingSessions } from "@/lib/services/cookguide";

export const GET = withAuth(async (_req, user) => {
  const sessions = await listCookingSessions(user.id);
  return Response.json({ sessions });
});
