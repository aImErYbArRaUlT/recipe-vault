# Architecture

This document explains how Recipe Vault is put together: the request lifecycle,
authentication, the scan pipeline, the data model, and how plans are enforced.

## Overview

Recipe Vault is one Next.js application that serves both the web UI and the API.
Business logic lives in `lib/services`; API route handlers are thin and run behind a
shared `withAuth` wrapper. State is stored in Postgres (via Drizzle) and Cloudflare R2.

## Request lifecycle

Every authenticated API route is wrapped with `withAuth`, which resolves the session,
loads the user, and passes it to the handler. Feature gates and rate limits run inside
the handler where needed.

```mermaid
sequenceDiagram
  participant C as Client
  participant W as withAuth
  participant H as Route handler
  participant S as lib/services
  participant DB as Postgres

  C->>W: Request (session cookie)
  W->>W: Resolve session, load user
  alt not authenticated
    W-->>C: 401
  else authenticated
    W->>H: handler(req, user, ctx)
    H->>H: Feature gate / rate limit (if applicable)
    H->>S: Call service with user.id
    S->>DB: Query scoped to user.id
    DB-->>S: Rows
    S-->>H: Result
    H-->>C: JSON
  end
```

## Authentication

NextAuth (Auth.js v5) issues a JWT session and stores plan and family data on the token.
Three providers are supported.

```mermaid
flowchart TD
  Login[Login] --> Cred[Email + password]
  Login --> Google[Google OAuth]
  Login --> Apple[Apple]
  Cred --> Verify{Valid?}
  Google --> Verify
  Apple --> AppleVerify[Verify Apple token signature and email]
  AppleVerify --> Verify
  Verify -->|yes| JWT[Issue JWT with plan + family]
  Verify -->|no| Reject[Reject]
  JWT --> Session[Session available to routes]
```

Native Apple sign-in verifies the identity token against Apple's public keys and only
trusts the email claim from the verified token, never a client-supplied value.

## Data isolation

There is no database row-level security. Isolation is enforced in application code:

- Every query is scoped by the authenticated `user.id`.
- Ownership is re-checked before any update or delete.
- Family-shared recipes are only reachable when the user has a `family_id`.

This keeps the rules explicit and testable, at the cost of requiring discipline in the
service layer. The shared helpers in `lib/services` and `lib/middleware` centralize it.

## Scan pipeline

Scanning turns a photo into a structured recipe. The original image is preserved.

```mermaid
sequenceDiagram
  participant C as Client
  participant API as /api/scan
  participant R2 as R2 storage
  participant AI as Gemini
  participant DB as Postgres

  C->>API: Upload image
  API->>R2: Store original
  API->>DB: Create scan job (pending)
  API->>AI: OCR + parse to structured recipe
  AI-->>API: Title, ingredients, steps
  API->>DB: Save parsed result on the job
  C->>API: Confirm
  API->>DB: Create recipe from job, keep original reference
```

## Data model

The core tables and their relationships.

```mermaid
erDiagram
  users ||--o{ cookbooks : owns
  users ||--o{ recipes : owns
  users ||--o| families : "admin of"
  families ||--o{ cookbooks : "shared into"
  cookbooks ||--o{ recipes : contains
  recipes ||--o{ recipe_versions : "has history"
  recipes ||--o{ cook_logs : "cooked as"
  recipes ||--o{ cooking_sessions : "cooked in"
  users ||--o{ scan_jobs : creates
  scan_jobs ||--o| recipes : produces
```

## Plans and feature gating

Plan entitlements, limits, the trial length, and pricing live in one client-safe module,
`src/lib/config/plans.ts`. Server routes read from it so the UI and the API never drift.

```mermaid
flowchart LR
  Req[AI or paid request] --> Gate{hasFeature for plan?}
  Gate -->|no| Deny[403 upgrade required]
  Gate -->|yes| Credit{Under daily AI limit?}
  Credit -->|no| Limit[429 daily limit]
  Credit -->|yes| Run[Run the feature]
```

New accounts start on a full-access trial. When the trial ends the account moves to the
free plan (manual recipes, limited cookbooks, no AI); paid plans unlock AI, cook logs,
version history, unlimited cookbooks, and family sharing.
