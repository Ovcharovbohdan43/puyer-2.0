-- Account settings: deletion requests + Auth email sync. Server writes via Prisma.

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ACCOUNT_PROFILE_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ACCOUNT_EMAIL_CHANGE_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ACCOUNT_PASSWORD_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ACCOUNT_DELETION_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ACCOUNT_DELETION_CANCELED';

do $$ begin
  create type "AccountDeletionStatus" as enum ('OPEN', 'CANCELED', 'COMPLETED');
exception
  when duplicate_object then null;
end $$;

create table if not exists public."AccountDeletionRequest" (
  "id" uuid not null default gen_random_uuid(),
  "userId" uuid not null,
  "organizationId" uuid,
  "status" "AccountDeletionStatus" not null default 'OPEN',
  "reason" text not null,
  "notifiedAt" timestamptz,
  "processedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "AccountDeletionRequest_pkey" primary key ("id"),
  constraint "AccountDeletionRequest_reason_len" check (
    char_length(btrim("reason")) >= 12 and char_length("reason") <= 2000
  )
);

do $$ begin
  alter table public."AccountDeletionRequest"
    add constraint "AccountDeletionRequest_userId_fkey"
    foreign key ("userId") references public."User"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."AccountDeletionRequest"
    add constraint "AccountDeletionRequest_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete set null on update cascade;
exception when duplicate_object then null;
end $$;

create unique index if not exists "AccountDeletionRequest_one_open_user"
  on public."AccountDeletionRequest" ("userId")
  where "status" = 'OPEN';

create index if not exists "AccountDeletionRequest_userId_createdAt_idx"
  on public."AccountDeletionRequest" ("userId", "createdAt" desc);

create index if not exists "AccountDeletionRequest_status_createdAt_idx"
  on public."AccountDeletionRequest" ("status", "createdAt" desc);

alter table public."AccountDeletionRequest" enable row level security;

create or replace function public.sync_user_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is not null and new.email is distinct from old.email then
    update public."User"
    set email = new.email, "updatedAt" = now()
    where id = new.id
      and not exists (
        select 1 from public."User" other
        where other.email = new.email and other.id <> new.id
      );
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute procedure public.sync_user_email_from_auth();

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'puyer_prisma') then
    grant select, insert, update, delete on table public."AccountDeletionRequest" to puyer_prisma;
    grant usage on type public."AccountDeletionStatus" to puyer_prisma;
  end if;
end $$;
