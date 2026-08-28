-- Identity bootstrap for SQL Editor (creates tables, then trigger + RLS).
-- User.id = auth.users.id.
-- Run this whole file once. Do not run the trigger section without the tables.
-- If you later add DATABASE_URL and use Prisma:
--   npx prisma migrate resolve --applied 20260828120000_identity

do $$ begin
  create type "OrgRole" as enum ('OWNER', 'MEMBER');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "Plan" as enum ('FREE', 'PRO', 'BUSINESS');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "ThemePreference" as enum ('LIGHT', 'DARK');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "AuditAction" as enum (
    'INVOICE_CREATED',
    'INVOICE_UPDATED',
    'INVOICE_SENT',
    'INVOICE_SHARED',
    'INVOICE_DELETED',
    'CLIENT_CREATED',
    'CLIENT_UPDATED',
    'STRIPE_CONNECTED',
    'STRIPE_DISCONNECTED',
    'SUBSCRIPTION_CHANGED',
    'REMINDER_SENT',
    'MEMBER_INVITED',
    'ROLE_CHANGED',
    'AUTH_SIGN_IN'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public."User" (
    "id" uuid not null,
    "email" text not null,
    "name" text,
    "avatarUrl" text,
    "locale" text not null default 'en',
    "timezone" text not null default 'UTC',
    "theme" "ThemePreference" not null default 'LIGHT',
    "createdAt" timestamp(3) not null default current_timestamp,
    "updatedAt" timestamp(3) not null default current_timestamp,
    constraint "User_pkey" primary key ("id")
);

create table if not exists public."Organization" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "plan" "Plan" not null default 'FREE',
    "createdAt" timestamp(3) not null default current_timestamp,
    "updatedAt" timestamp(3) not null default current_timestamp,
    constraint "Organization_pkey" primary key ("id")
);

create table if not exists public."OrganizationMember" (
    "id" uuid not null default gen_random_uuid(),
    "userId" uuid not null,
    "organizationId" uuid not null,
    "role" "OrgRole" not null,
    "createdAt" timestamp(3) not null default current_timestamp,
    constraint "OrganizationMember_pkey" primary key ("id")
);

create table if not exists public."BusinessProfile" (
    "id" uuid not null default gen_random_uuid(),
    "organizationId" uuid not null,
    "businessName" text not null default '',
    "businessAddress" text not null default '',
    "defaultCurrency" text not null default 'USD',
    "defaultTaxRate" text not null default '0',
    "logoUrl" text,
    "createdAt" timestamp(3) not null default current_timestamp,
    "updatedAt" timestamp(3) not null default current_timestamp,
    constraint "BusinessProfile_pkey" primary key ("id")
);

create table if not exists public."NotificationPreference" (
    "id" uuid not null default gen_random_uuid(),
    "userId" uuid not null,
    "organizationId" uuid not null,
    "emailEnabled" boolean not null default true,
    "inAppEnabled" boolean not null default true,
    "createdAt" timestamp(3) not null default current_timestamp,
    "updatedAt" timestamp(3) not null default current_timestamp,
    constraint "NotificationPreference_pkey" primary key ("id")
);

create table if not exists public."AuditLog" (
    "id" uuid not null default gen_random_uuid(),
    "actorUserId" uuid,
    "organizationId" uuid,
    "action" "AuditAction" not null,
    "entityType" text not null,
    "entityId" text,
    "metadata" jsonb,
    "createdAt" timestamp(3) not null default current_timestamp,
    constraint "AuditLog_pkey" primary key ("id")
);

create unique index if not exists "User_email_key" on public."User"("email");
create unique index if not exists "OrganizationMember_userId_organizationId_key"
  on public."OrganizationMember"("userId", "organizationId");
create index if not exists "OrganizationMember_organizationId_idx"
  on public."OrganizationMember"("organizationId");
create unique index if not exists "BusinessProfile_organizationId_key"
  on public."BusinessProfile"("organizationId");
create unique index if not exists "NotificationPreference_userId_organizationId_key"
  on public."NotificationPreference"("userId", "organizationId");
create index if not exists "AuditLog_organizationId_createdAt_idx"
  on public."AuditLog"("organizationId", "createdAt");

do $$ begin
  alter table public."OrganizationMember"
    add constraint "OrganizationMember_userId_fkey"
    foreign key ("userId") references public."User"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."OrganizationMember"
    add constraint "OrganizationMember_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."BusinessProfile"
    add constraint "BusinessProfile_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."NotificationPreference"
    add constraint "NotificationPreference_userId_fkey"
    foreign key ("userId") references public."User"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."NotificationPreference"
    add constraint "NotificationPreference_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."AuditLog"
    add constraint "AuditLog_actorUserId_fkey"
    foreign key ("actorUserId") references public."User"("id") on delete set null on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."AuditLog"
    add constraint "AuditLog_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete set null on update cascade;
exception when duplicate_object then null;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  display_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'Workspace'
  );

  insert into public."User" (id, email, name)
  values (new.id, new.email, display_name)
  on conflict (id) do update
    set email = excluded.email;

  insert into public."Organization" (id, name, plan)
  values (gen_random_uuid(), display_name || '''s workspace', 'FREE')
  returning id into org_id;

  insert into public."OrganizationMember" ("userId", "organizationId", role)
  values (new.id, org_id, 'OWNER');

  insert into public."BusinessProfile" ("organizationId", "businessName")
  values (org_id, display_name);

  insert into public."NotificationPreference" ("userId", "organizationId")
  values (new.id, org_id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public."User" enable row level security;
alter table public."Organization" enable row level security;
alter table public."OrganizationMember" enable row level security;
alter table public."BusinessProfile" enable row level security;
alter table public."NotificationPreference" enable row level security;
alter table public."AuditLog" enable row level security;

create or replace function public.user_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select "organizationId"
  from public."OrganizationMember"
  where "userId" = (select auth.uid());
$$;

drop policy if exists "users_self" on public."User";
create policy "users_self" on public."User"
  for select
  to authenticated
  using (id = (select auth.uid()));

drop policy if exists "org_member_read" on public."Organization";
create policy "org_member_read" on public."Organization"
  for select
  to authenticated
  using (id in (select public.user_organization_ids()));

drop policy if exists "org_member_read" on public."OrganizationMember";
create policy "org_member_read" on public."OrganizationMember"
  for select
  to authenticated
  using ("organizationId" in (select public.user_organization_ids()));

drop policy if exists "org_member_read" on public."BusinessProfile";
create policy "org_member_read" on public."BusinessProfile"
  for select
  to authenticated
  using ("organizationId" in (select public.user_organization_ids()));

drop policy if exists "org_member_read" on public."NotificationPreference";
create policy "org_member_read" on public."NotificationPreference"
  for select
  to authenticated
  using (
    "organizationId" in (select public.user_organization_ids())
    and "userId" = (select auth.uid())
  );

drop policy if exists "org_member_read" on public."AuditLog";
create policy "org_member_read" on public."AuditLog"
  for select
  to authenticated
  using ("organizationId" in (select public.user_organization_ids()));

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.user_organization_ids() from public, anon;
grant execute on function public.user_organization_ids() to authenticated;
