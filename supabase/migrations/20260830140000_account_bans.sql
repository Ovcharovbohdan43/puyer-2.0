-- Account / workspace bans. Server-only (RLS on, no authenticated policies).
-- Reason is required and stored. Temporary bans need endsAt; permanent bans do not.

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ACCOUNT_BANNED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ACCOUNT_UNBANNED';

do $$ begin
  create type "BanTargetType" as enum ('USER', 'ORGANIZATION');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "BanKind" as enum ('TEMPORARY', 'PERMANENT');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "BanStatus" as enum ('ACTIVE', 'LIFTED');
exception
  when duplicate_object then null;
end $$;

create table if not exists public."AccountBan" (
  "id" uuid not null default gen_random_uuid(),
  "targetType" "BanTargetType" not null,
  "kind" "BanKind" not null,
  "status" "BanStatus" not null default 'ACTIVE',
  "reason" text not null,
  "userId" uuid,
  "organizationId" uuid,
  "startsAt" timestamptz not null default now(),
  "endsAt" timestamptz,
  "liftedAt" timestamptz,
  "notifiedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "AccountBan_pkey" primary key ("id"),
  constraint "AccountBan_reason_len" check (char_length(btrim("reason")) >= 12 and char_length("reason") <= 2000),
  constraint "AccountBan_target_chk" check (
    ("targetType" = 'USER' and "userId" is not null and "organizationId" is null)
    or ("targetType" = 'ORGANIZATION' and "organizationId" is not null and "userId" is null)
  ),
  constraint "AccountBan_kind_chk" check (
    ("kind" = 'PERMANENT' and "endsAt" is null)
    or ("kind" = 'TEMPORARY' and "endsAt" is not null)
  )
);

do $$ begin
  alter table public."AccountBan"
    add constraint "AccountBan_userId_fkey"
    foreign key ("userId") references public."User"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."AccountBan"
    add constraint "AccountBan_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

create index if not exists "AccountBan_userId_status_idx" on public."AccountBan" ("userId", "status");
create index if not exists "AccountBan_organizationId_status_idx" on public."AccountBan" ("organizationId", "status");
create index if not exists "AccountBan_status_endsAt_idx" on public."AccountBan" ("status", "endsAt");

create unique index if not exists "AccountBan_one_active_user"
  on public."AccountBan" ("userId")
  where "status" = 'ACTIVE' and "userId" is not null;

create unique index if not exists "AccountBan_one_active_org"
  on public."AccountBan" ("organizationId")
  where "status" = 'ACTIVE' and "organizationId" is not null;

alter table public."AccountBan" enable row level security;

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'puyer_prisma') then
    grant select, insert, update, delete on table public."AccountBan" to puyer_prisma;
    grant usage on type public."BanTargetType" to puyer_prisma;
    grant usage on type public."BanKind" to puyer_prisma;
    grant usage on type public."BanStatus" to puyer_prisma;
  end if;
end $$;
