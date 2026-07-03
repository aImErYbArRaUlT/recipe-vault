export default {
  "*.{ts,tsx}": "eslint --fix",
  // When dependencies change, block the commit on high or critical vulnerabilities in production deps.
  "package-lock.json": () => "npm audit --omit=dev --audit-level=high",
};
