import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { joinFamily } from "@/lib/services/family";

const schema = z.object({
  inviteCode: z.string().min(1),
});

export const POST = withAuth(async (req, user) => {
  const gate = await requireFeature("family_sharing")();
  if (gate) return gate;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const family = await joinFamily(user.id, parsed.data.inviteCode);
  if (!family) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(family);
});
