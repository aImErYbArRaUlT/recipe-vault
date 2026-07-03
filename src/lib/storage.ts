const PURPOSE_PREFIX: Record<string, string> = {
  scan: "scans",
  recipe: "recipes",
  "cook-log": "cook-logs",
  avatar: "avatars",
};

// Keep a safe filename charset and strip leading dots to block path tricks.
function sanitizeSegment(value: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9._-]/g, "_").replace(/^\.+/, "");
  return cleaned.slice(0, 128) || "file";
}

export function buildStorageKey(
  purpose: keyof typeof PURPOSE_PREFIX,
  userId: string,
  fileName: string,
  subId?: string
) {
  const prefix = PURPOSE_PREFIX[purpose];
  if (purpose === "avatar") {
    return `${prefix}/${userId}.webp`;
  }

  const safeSubId = sanitizeSegment(subId ?? "upload");
  const safeName = sanitizeSegment(fileName);
  return `${prefix}/${userId}/${safeSubId}/${safeName}`;
}
