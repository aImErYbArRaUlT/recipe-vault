import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, accounts } from "@/lib/db/schema";
import { TRIAL_DURATION_MS } from "@/lib/config/plans";

export async function createCredentialsUser(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const trialEndsAt = new Date(Date.now() + TRIAL_DURATION_MS);

  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      name: input.displayName,
      displayName: input.displayName,
      passwordHash,
      planId: "trial",
      subscriptionStatus: "trialing",
      trialEndsAt,
    })
    .returning();

  await db.insert(accounts).values({
    userId: user.id,
    type: "credentials",
    provider: "credentials",
    providerAccountId: user.id,
  });

  return user;
}
