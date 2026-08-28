# Puyer

SaaS invoicing software. Architecture and implementation order: [`PLAN.md`](./PLAN.md).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — development server
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript
- `npm run test` — Vitest
- `npm run build` — production build
- `npx prisma generate` — Prisma Client
- `npx prisma migrate deploy` — apply identity migrations

Do not commit secrets. Copy `.env.example` to `.env.local`.

Supabase browser/server clients: [`docs/supabase.md`](./docs/supabase.md).  
Magic-link auth and tenancy: [`docs/auth.md`](./docs/auth.md).

After migrate, run [`supabase/migrations/20260828120000_identity_rls_and_trigger.sql`](./supabase/migrations/20260828120000_identity_rls_and_trigger.sql) in the Supabase SQL editor (auth trigger + RLS). Allow redirect URL `http://localhost:3000/auth/callback`.
