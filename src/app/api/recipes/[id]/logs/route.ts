import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { createCookLog, listCookLogs } from "@/lib/services/cook-logs";

const schema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
  wouldMakeAgain: z.boolean().optional(),
});

export const GET = withAuth<{ id: string }>(async (_req, user, { params }) => {
  const { id } = await params;
  const gate = await requireFeature("cook_logs")();
  if (gate) return gate;

  const logs = await listCookLogs(user.id, id);
  return Response.json({ recipeId: id, logs });
});

export const POST = withAuth<{ id: string }>(async (req, user, { params }) => {
  const { id } = await params;
  const gate = await requireFeature("cook_logs")();
  if (gate) return gate;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const log = await createCookLog(user.id, id, parsed.data);
  return Response.json(log, { status: 201 });
});
