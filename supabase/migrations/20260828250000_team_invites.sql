-- Phase 8 team invites and active workspace. Idempotent for SQL Editor.

do $$ begin
  create type "InviteStatus" as enum ('PENDING', 'ACCEPTED', 'REVOKED');
exception when duplicate_object then null;
end $$;

alter table public."User"
  add column if not exists "activeOrganizationId" uuid;

alter table public."OrganizationMember"
  add column if not exists "updatedAt" timestamp(3) not null default current_timestamp;

create table if not exists public."OrganizationInvite" (
  "id" uuid not null default gen_random_uuid(),
  "organizationId" uuid not null,
  "email" text not null,
  "role" "OrgRole" not null default 'MEMBER',
  "tokenHash" text not null,
  "status" "InviteStatus" not null default 'PENDING',
  "expiresAt" timestamp(3) not null,
  "invitedByUserId" uuid not null,
  "acceptedAt" timestamp(3),
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "OrganizationInvite_pkey" primary key ("id")
);

create unique index if not exists "OrganizationInvite_tokenHash_key" on public."OrganizationInvite"("tokenHash");
create index if not exists "OrganizationInvite_organizationId_email_status_idx"
  on public."OrganizationInvite"("organizationId", "email", "status");
create index if not exists "User_activeOrganizationId_idx" on public."User"("activeOrganizationId");

do $$ begin
  alter table public."User"
    add constraint "User_activeOrganizationId_fkey"
    foreign key ("activeOrganizationId") references public."Organization"("id") on delete set null on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."OrganizationInvite"
    add constraint "OrganizationInvite_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."OrganizationInvite"
    add constraint "OrganizationInvite_invitedByUserId_fkey"
    foreign key ("invitedByUserId") references public."User"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

update public."User" u
set "activeOrganizationId" = m."organizationId"
from public."OrganizationMember" m
where u."id" = m."userId"
  and u."activeOrganizationId" is null;

alter table public."OrganizationInvite" enable row level security;

drop policy if exists "org_member_read" on public."OrganizationInvite";
create policy "org_member_read" on public."OrganizationInvite"
  for select
  to authenticated
  using ("organizationId" in (select public.user_organization_ids()));

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'puyer_prisma') then
    grant select, insert, update, delete on table public."OrganizationInvite" to puyer_prisma;
    grant usage on type public."InviteStatus" to puyer_prisma;
  end if;
end $$;
