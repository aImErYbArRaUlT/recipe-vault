# Recipe Vault Setup

## Local prerequisites
- Node 20+
- Postgres 16+
- Cloudflare R2 credentials
- Stripe test keys
- Gemini API key

## Environment
Copy `.env.example` to `.env` and fill in values.

Required:
- DATABASE_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- R2_ENDPOINT
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET_NAME
- R2_PUBLIC_URL
- GEMINI_API_KEY

## Install
```bash
npm install
```

## Database
Generate migrations and apply:
```bash
npm run db:generate
npm run db:migrate
```

Optional seed:
```bash
npm run db:seed
```

## Run
```bash
npm run dev
```

## Tests
```bash
npm test
```
