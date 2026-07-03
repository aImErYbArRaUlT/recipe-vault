import { withAuth } from "@/lib/middleware/with-auth";
import { uploadFile } from "@/lib/r2";
import { buildStorageKey } from "@/lib/storage";
import { convertHeicToJpeg } from "@/lib/images";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const ALLOWED_UPLOAD_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);
const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"]);

function isHeic(contentType: string, fileName: string): boolean {
  if (HEIC_TYPES.has(contentType.toLowerCase())) return true;
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ext === "heic" || ext === "heif";
}

export const POST = withAuth(async (req, user) => {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const purpose = formData.get("purpose") as string | null;
  const subId = (formData.get("subId") as string) || undefined;

  if (!file || !purpose) {
    return Response.json({ error: "file and purpose are required" }, { status: 400 });
  }

  const validPurposes = ["scan", "recipe", "cook-log", "avatar"];
  if (!validPurposes.includes(purpose)) {
    return Response.json({ error: "Invalid purpose" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "File exceeds 20MB limit" }, { status: 400 });
  }

  // Only accept images. Guards against storing HTML/SVG served from the R2 origin.
  const declaredType = (file.type || "").toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_UPLOAD_TYPES.has(declaredType) && !ALLOWED_EXTS.has(ext)) {
    return Response.json({ error: "Unsupported file type" }, { status: 400 });
  }

  let buffer: Buffer = Buffer.from(await file.arrayBuffer());
  let contentType = file.type || "application/octet-stream";
  let fileName = file.name;

  if (isHeic(contentType, fileName)) {
    buffer = await convertHeicToJpeg(buffer);
    contentType = "image/jpeg";
    fileName = fileName.replace(/\.heic$/i, ".jpg").replace(/\.heif$/i, ".jpg");
  }

  const key = buildStorageKey(purpose, user.id, fileName, subId);
  const fileUrl = await uploadFile(key, buffer, contentType);

  return Response.json({ fileUrl, key });
});
