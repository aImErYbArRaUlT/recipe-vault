import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { deleteCookbook, getCookbook, updateCookbook } from "@/lib/services/cookbooks";

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
});

export const PATCH = withAuth<{ id: string }>(async (req, user, { params }) => {
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const cookbook = await updateCookbook(user.id, id, parsed.data);
  if (!cookbook) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(cookbook);
});

export const GET = withAuth<{ id: string }>(async (_req, user, { params }) => {
  const { id } = await params;

  const cookbook = await getCookbook(user.id, id);
  if (!cookbook) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(cookbook);
});

export const DELETE = withAuth<{ id: string }>(async (_req, user, { params }) => {
  const { id } = await params;

  const cookbook = await deleteCookbook(user.id, id);
  if (!cookbook) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ status: "deleted" });
});
