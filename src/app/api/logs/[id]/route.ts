import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { deleteCookLog, updateCookLog } from "@/lib/services/cook-logs";

const schema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
  wouldMakeAgain: z.boolean().optional(),
});

export const PATCH = withAuth<{ id: string }>(async (req, user, { params }) => {
  const { id } = await params;
  const gate = await requireFeature("cook_logs")();
  if (gate) return gate;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const log = await updateCookLog(user.id, id, parsed.data);
  if (!log) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(log);
});

export const DELETE = withAuth<{ id: string }>(async (_req, user, { params }) => {
  const { id } = await params;
  const gate = await requireFeature("cook_logs")();
  if (gate) return gate;

  const log = await deleteCookLog(user.id, id);
  if (!log) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ status: "deleted" });
});
