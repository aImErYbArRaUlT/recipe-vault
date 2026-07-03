import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { canCreateCookbook } from "@/lib/middleware/feature-gate";
import { createCookbook, listCookbooks } from "@/lib/services/cookbooks";

const createSchema = z.object({
  title: z.string().min(1),
});

export const GET = withAuth(async (_req, user) => {
  const cookbooks = await listCookbooks(user.id);
  return Response.json(cookbooks);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await listCookbooks(user.id);
  if (!canCreateCookbook(user, existing.length)) {
    return Response.json({ error: "Cookbook limit reached" }, { status: 403 });
  }

  const cookbook = await createCookbook(user.id, parsed.data.title);
  return Response.json(cookbook, { status: 201 });
});
