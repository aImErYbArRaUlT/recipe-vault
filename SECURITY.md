# Security Policy

## Reporting a vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Use GitHub's private vulnerability reporting: open the repository's **Security** tab
and click **Report a vulnerability**.

We aim to acknowledge a report within 3 business days and to share a remediation
timeline within 10 business days. Please give us reasonable time to release a fix
before any public disclosure.

## Scope

Security fixes are applied to the `main` branch. Because Recipe Vault can be
self-hosted, operators are responsible for their own deployment: keep secrets out of
version control, rotate keys if exposed, and keep dependencies up to date.

## Good to know

- Data isolation is enforced in application code (every query is scoped to the
  authenticated user), not by database row-level security.
- Secrets are provided via environment variables only. Never commit a real `.env`.
