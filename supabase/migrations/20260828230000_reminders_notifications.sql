-- Phase 6 reminders, email log, in-app notifications. Idempotent for SQL Editor.

do $$ begin
  create type "ReminderType" as enum ('BEFORE_DUE', 'ON_DUE', 'AFTER_DUE');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "ReminderStatus" as enum ('SCHEDULED', 'SENT', 'SKIPPED', 'FAILED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "NotificationType" as enum ('INVOICE', 'PAYMENT', 'REMINDER', 'SYSTEM', 'SUBSCRIPTION');
exception when duplicate_object then null;
end $$;

create table if not exists public."ReminderRule" (
  "id" uuid not null default gen_random_uuid(),
  "organizationId" uuid not null,
  "enabled" boolean not null default true,
  "daysBeforeDue" integer not null default 3,
  "onDue" boolean not null default true,
  "daysAfterDue" integer not null default 3,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "ReminderRule_pkey" primary key ("id")
);

create table if not exists public."ReminderEvent" (
  "id" uuid not null default gen_random_uuid(),
  "organizationId" uuid not null,
  "invoiceId" uuid not null,
  "type" "ReminderType" not null,
  "scheduledDate" date not null,
  "status" "ReminderStatus" not null,
  "providerMessageId" text,
  "sentAt" timestamp(3),
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "ReminderEvent_pkey" primary key ("id")
);

create table if not exists public."Notification" (
  "id" uuid not null default gen_random_uuid(),
  "userId" uuid not null,
  "organizationId" uuid not null,
  "type" "NotificationType" not null,
  "title" text not null,
  "message" text not null,
  "entityType" text,
  "entityId" text,
  "readAt" timestamp(3),
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint "Notification_pkey" primary key ("id")
);

create unique index if not exists "ReminderRule_organizationId_key" on public."ReminderRule"("organizationId");
create unique index if not exists "ReminderEvent_invoiceId_type_scheduledDate_key"
  on public."ReminderEvent"("invoiceId", "type", "scheduledDate");
create index if not exists "ReminderEvent_organizationId_status_scheduledDate_idx"
  on public."ReminderEvent"("organizationId", "status", "scheduledDate");
create index if not exists "ReminderEvent_invoiceId_idx" on public."ReminderEvent"("invoiceId");
create index if not exists "Notification_userId_createdAt_idx" on public."Notification"("userId", "createdAt");
create index if not exists "Notification_userId_readAt_idx" on public."Notification"("userId", "readAt");
create index if not exists "Notification_organizationId_createdAt_idx"
  on public."Notification"("organizationId", "createdAt");

do $$ begin
  alter table public."ReminderRule"
    add constraint "ReminderRule_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."ReminderEvent"
    add constraint "ReminderEvent_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."ReminderEvent"
    add constraint "ReminderEvent_invoiceId_fkey"
    foreign key ("invoiceId") references public."Invoice"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."Notification"
    add constraint "Notification_userId_fkey"
    foreign key ("userId") references public."User"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."Notification"
    add constraint "Notification_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

insert into public."ReminderRule" ("organizationId")
select o."id"
from public."Organization" o
where not exists (
  select 1 from public."ReminderRule" r where r."organizationId" = o."id"
);

alter table public."ReminderRule" enable row level security;
alter table public."ReminderEvent" enable row level security;
alter table public."Notification" enable row level security;

drop policy if exists "org_member_read" on public."ReminderRule";
create policy "org_member_read" on public."ReminderRule"
  for select
  to authenticated
  using ("organizationId" in (select public.user_organization_ids()));

drop policy if exists "org_member_read" on public."ReminderEvent";
create policy "org_member_read" on public."ReminderEvent"
  for select
  to authenticated
  using ("organizationId" in (select public.user_organization_ids()));

drop policy if exists "own_read" on public."Notification";
create policy "own_read" on public."Notification"
  for select
  to authenticated
  using (
    "userId" = (select auth.uid())
    and "organizationId" in (select public.user_organization_ids())
  );

drop policy if exists "own_update" on public."Notification";
create policy "own_update" on public."Notification"
  for update
  to authenticated
  using (
    "userId" = (select auth.uid())
    and "organizationId" in (select public.user_organization_ids())
  )
  with check (
    "userId" = (select auth.uid())
    and "organizationId" in (select public.user_organization_ids())
  );

drop policy if exists "own_pref_update" on public."NotificationPreference";
create policy "own_pref_update" on public."NotificationPreference"
  for update
  to authenticated
  using (
    "userId" = (select auth.uid())
    and "organizationId" in (select public.user_organization_ids())
  )
  with check (
    "userId" = (select auth.uid())
    and "organizationId" in (select public.user_organization_ids())
  );

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'puyer_prisma') then
    grant select, insert, update, delete on table public."ReminderRule" to puyer_prisma;
    grant select, insert, update, delete on table public."ReminderEvent" to puyer_prisma;
    grant select, insert, update, delete on table public."Notification" to puyer_prisma;
    grant usage on type public."ReminderType" to puyer_prisma;
    grant usage on type public."ReminderStatus" to puyer_prisma;
    grant usage on type public."NotificationType" to puyer_prisma;
  end if;
end $$;
