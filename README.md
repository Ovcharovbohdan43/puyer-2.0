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

npm 11+ blocks dependency install scripts until they are listed in `package.json` `allowScripts` (Prisma engines, sharp for `next/image`, unrs-resolver for Next, protobufjs). After bumping those packages, run `npm approve-scripts --allow-scripts-pending` and approve the new versions.

Supabase browser/server clients: [`docs/supabase.md`](./docs/supabase.md).  
Magic-link auth and tenancy: [`docs/auth.md`](./docs/auth.md).

After migrate, run [`supabase/migrations/20260828120000_identity_rls_and_trigger.sql`](./supabase/migrations/20260828120000_identity_rls_and_trigger.sql) in the Supabase SQL editor (auth trigger + RLS). Allow redirect URL `http://localhost:3000/auth/callback`.
