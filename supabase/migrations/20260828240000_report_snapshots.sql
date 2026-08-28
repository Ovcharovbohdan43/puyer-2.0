-- Phase 7 monthly report snapshots. Idempotent for SQL Editor.

create table if not exists public."ReportSnapshot" (
  "id" uuid not null default gen_random_uuid(),
  "organizationId" uuid not null,
  "period" text not null,
  "metrics" jsonb not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "ReportSnapshot_pkey" primary key ("id")
);

create unique index if not exists "ReportSnapshot_organizationId_period_key"
  on public."ReportSnapshot"("organizationId", "period");

do $$ begin
  alter table public."ReportSnapshot"
    add constraint "ReportSnapshot_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

alter table public."ReportSnapshot" enable row level security;

drop policy if exists "org_member_read" on public."ReportSnapshot";
create policy "org_member_read" on public."ReportSnapshot"
  for select
  to authenticated
  using ("organizationId" in (select public.user_organization_ids()));

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'puyer_prisma') then
    grant select, insert, update, delete on table public."ReportSnapshot" to puyer_prisma;
  end if;
end $$;
