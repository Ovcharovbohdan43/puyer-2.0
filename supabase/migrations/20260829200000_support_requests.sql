-- Help Center support requests. Idempotent for SQL Editor.

do $$ begin
  create type public."SupportRequestStatus" as enum ('OPEN', 'CLOSED');
exception
  when duplicate_object then null;
end $$;

create table if not exists public."SupportRequest" (
  "id" uuid not null default gen_random_uuid(),
  "email" text not null,
  "name" text not null,
  "topic" text not null,
  "message" text not null,
  "userId" uuid,
  "organizationId" uuid,
  "status" public."SupportRequestStatus" not null default 'OPEN',
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "SupportRequest_pkey" primary key ("id")
);

do $$ begin
  alter table public."SupportRequest"
    add constraint "SupportRequest_userId_fkey"
    foreign key ("userId") references public."User"("id") on delete set null on update cascade;
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter table public."SupportRequest"
    add constraint "SupportRequest_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete set null on update cascade;
exception
  when duplicate_object then null;
end $$;

create index if not exists "SupportRequest_userId_createdAt_idx"
  on public."SupportRequest" ("userId", "createdAt" desc);

create index if not exists "SupportRequest_email_createdAt_idx"
  on public."SupportRequest" ("email", "createdAt" desc);

create index if not exists "SupportRequest_status_createdAt_idx"
  on public."SupportRequest" ("status", "createdAt" desc);

alter table public."SupportRequest" enable row level security;

drop policy if exists "owner_read_own_tickets" on public."SupportRequest";
create policy "owner_read_own_tickets" on public."SupportRequest"
  for select
  to authenticated
  using ("userId" is not null and "userId" = (select auth.uid()));

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'puyer_prisma') then
    grant select, insert, update, delete on table public."SupportRequest" to puyer_prisma;
    grant usage on type public."SupportRequestStatus" to puyer_prisma;
  end if;
end $$;
