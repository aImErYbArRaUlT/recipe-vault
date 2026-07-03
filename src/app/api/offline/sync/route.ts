import { withAuth } from "@/lib/middleware/with-auth";

export const POST = withAuth(async () => {
  return Response.json({ status: "planned" });
});
