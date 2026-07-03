import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { rateLimit } from "@/lib/middleware/rate-limit";

// Scaling is pure math, no AI cost; just a basic abuse cap.
const burst = rateLimit({ limit: 60, windowMs: 60_000 });

const schema = z.object({
  currentServings: z.number().positive(),
  targetServings: z.number().positive(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string().optional(),
    })
  ),
});

export const POST = withAuth(async (req, user) => {
  const tooMany = await burst("modify:scale", user.id);
  if (tooMany) return tooMany;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const ratio = parsed.data.targetServings / parsed.data.currentServings;
  const ingredients = parsed.data.ingredients.map((item) => ({
    ...item,
    quantity: Number((item.quantity * ratio).toFixed(2)),
  }));

  return Response.json({
    currentServings: parsed.data.currentServings,
    targetServings: parsed.data.targetServings,
    ingredients,
  });
});
