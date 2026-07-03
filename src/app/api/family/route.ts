import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { createFamily, getFamilyDetails, listFamilyMembers, updateFamilyName } from "@/lib/services/family";

const schema = z.object({
  name: z.string().min(1),
});

export const POST = withAuth(async (req, user) => {
  const gate = await requireFeature("family_sharing")();
  if (gate) return gate;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const family = await createFamily(user.id, parsed.data.name);
  return Response.json(family, { status: 201 });
});

export const GET = withAuth(async (_req, user) => {
  const gate = await requireFeature("family_sharing")();
  if (gate) return gate;

  const family = await getFamilyDetails(user.id);
  if (!family) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const members = await listFamilyMembers(user.id);
  return Response.json({ ...family, members });
});

export const PATCH = withAuth(async (req, user) => {
  const gate = await requireFeature("family_sharing")();
  if (gate) return gate;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const family = await updateFamilyName(user.id, parsed.data.name);
  if (!family) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(family);
});
