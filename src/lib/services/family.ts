import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cookbooks, families, users } from "@/lib/db/schema";
import { MAX_FAMILY_MEMBERS } from "@/lib/config/plans";

function buildInviteCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

// Returns the family the user administers, or null if they are not its admin.
async function getAdminFamily(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.familyId) return null;
  const family = await db.query.families.findFirst({
    where: eq(families.id, user.familyId),
  });
  if (!family || family.adminUserId !== userId) return null;
  return family;
}

export async function createFamily(userId: string, name: string) {
  const inviteCode = buildInviteCode();
  const [family] = await db
    .insert(families)
    .values({
      name,
      adminUserId: userId,
      inviteCode,
    })
    .returning();

  await db
    .update(users)
    .set({ familyId: family.id, familyRole: "admin" })
    .where(eq(users.id, userId));

  return family;
}

export async function getFamilyDetails(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.familyId) return null;
  return db.query.families.findFirst({ where: eq(families.id, user.familyId) });
}

export async function listFamilyMembers(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.familyId) return [];
  return db.query.users.findMany({
    where: eq(users.familyId, user.familyId),
    columns: {
      id: true,
      name: true,
      displayName: true,
      email: true,
      familyRole: true,
    },
  });
}

export async function updateFamilyName(userId: string, name: string) {
  const family = await getAdminFamily(userId);
  if (!family) return null;
  const [updated] = await db
    .update(families)
    .set({ name })
    .where(eq(families.id, family.id))
    .returning();
  return updated ?? null;
}

export async function generateInviteCode(userId: string) {
  const family = await getAdminFamily(userId);
  if (!family) return null;
  const inviteCode = buildInviteCode();
  const [updated] = await db
    .update(families)
    .set({ inviteCode })
    .where(eq(families.id, family.id))
    .returning();
  return updated ?? null;
}

export async function joinFamily(userId: string, inviteCode: string) {
  return db.transaction(async (tx) => {
    // Lock the family row so concurrent joins cannot exceed the member cap.
    const [family] = await tx
      .select()
      .from(families)
      .where(eq(families.inviteCode, inviteCode))
      .for("update");

    if (!family) return null;

    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.familyId, family.id));

    if (Number(count) >= (family.maxMembers ?? MAX_FAMILY_MEMBERS)) {
      throw new Error("Family has reached the maximum number of members");
    }

    await tx
      .update(users)
      .set({ familyId: family.id, familyRole: "member" })
      .where(eq(users.id, userId));

    return family;
  });
}

export async function leaveFamily(userId: string) {
  await db
    .update(users)
    .set({ familyId: null, familyRole: null })
    .where(eq(users.id, userId));
  return { status: "left" };
}

export async function removeFamilyMember(adminId: string, memberId: string) {
  const family = await getAdminFamily(adminId);
  if (!family) return null;
  // The admin cannot remove themselves here; use leave or delete the family.
  if (memberId === adminId) return null;

  await db
    .update(users)
    .set({ familyId: null, familyRole: null })
    .where(and(eq(users.id, memberId), eq(users.familyId, family.id)));

  return { status: "removed" };
}

export async function getFamilyCookbook(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.familyId) return null;

  return db.query.cookbooks.findFirst({
    where: and(eq(cookbooks.familyId, user.familyId), eq(cookbooks.isShared, true)),
  });
}
