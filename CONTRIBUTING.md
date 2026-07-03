# Contributing to Recipe Vault

Thanks for your interest in contributing. This guide covers local setup and the conventions the project follows.

## Prerequisites

- Node 20+ (see `.nvmrc`, run `nvm use`)
- A Postgres 16 database (or use the provided Docker stack)

## Local setup

```bash
cp .env.example .env      # fill in the values you have
npm ci
npm run db:migrate        # apply Drizzle migrations
npm run db:seed           # optional sample data
npm run dev
```

Or run the whole stack (app + Postgres) in Docker:

```bash
docker compose up --build
```

## Checks

Run these before opening a pull request. CI runs the same set.

```bash
npm run lint
npx tsc --noEmit
npm run test
```

## Conventions

- TypeScript strict mode. Avoid `any`; prefer explicit types at boundaries.
- Keep route handlers thin. Business logic and database access live in `src/lib/services` and go through the shared data-access helpers.
- All queries must be scoped to the authenticated user. Check ownership before any update or delete.
- Enforce feature gating server-side for every paid feature, not just in the UI.
- Comments: a short JSDoc block (2 lines max) is allowed at the top of a file. Everywhere else use single-line `//` comments.
- Validate API inputs with Zod.

## Pull requests

- Keep changes focused and include tests for new behavior.
- Describe what changed and why. Do not include unrelated formatting churn.
