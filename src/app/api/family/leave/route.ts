import { withAuth } from "@/lib/middleware/with-auth";
import { leaveFamily } from "@/lib/services/family";

export const POST = withAuth(async (_req, user) => {
  const result = await leaveFamily(user.id);
  return Response.json(result);
});
