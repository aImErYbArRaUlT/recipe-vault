import { deleteFile } from "@/lib/r2";
import { withAuth } from "@/lib/middleware/with-auth";

export const DELETE = withAuth<{ key: string[] }>(async (_req, user, { params }) => {
  const { key: keyParts } = await params;
  const key = keyParts.join("/");

  const validPrefixes = [
    `scans/${user.id}/`,
    `recipes/${user.id}/`,
    `cook-logs/${user.id}/`,
    `avatars/${user.id}.`,
  ];
  if (!validPrefixes.some((prefix) => key.startsWith(prefix))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteFile(key);
  return Response.json({ status: "deleted" });
});
