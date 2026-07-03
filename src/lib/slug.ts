export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function uniqueSlug(base: string) {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
