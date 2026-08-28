-- Phase 5 platform subscriptions (Domain A). Idempotent for SQL Editor.

do $$ begin
  create type "SubscriptionStatus" as enum (
    'TRIALING', 'ACTIVE', 'PAST_DUE', 'UNPAID', 'CANCELED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public."Subscription" (
  "id" uuid not null default gen_random_uuid(),
  "organizationId" uuid not null,
  "stripeCustomerId" text not null,
  "stripeSubscriptionId" text not null,
  "stripePriceId" text not null,
  "status" "SubscriptionStatus" not null,
  "currentPeriodStart" timestamp(3),
  "currentPeriodEnd" timestamp(3),
  "cancelAtPeriodEnd" boolean not null default false,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "Subscription_pkey" primary key ("id")
);

create table if not exists public."SubscriptionEvent" (
  "id" uuid not null default gen_random_uuid(),
  "organizationId" uuid not null,
  "stripeEventId" text not null,
  "type" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint "SubscriptionEvent_pkey" primary key ("id")
);

create unique index if not exists "Subscription_organizationId_key" on public."Subscription"("organizationId");
create unique index if not exists "Subscription_stripeSubscriptionId_key" on public."Subscription"("stripeSubscriptionId");
create unique index if not exists "SubscriptionEvent_stripeEventId_key" on public."SubscriptionEvent"("stripeEventId");
create index if not exists "Subscription_stripeCustomerId_idx" on public."Subscription"("stripeCustomerId");
create index if not exists "SubscriptionEvent_organizationId_createdAt_idx"
  on public."SubscriptionEvent"("organizationId", "createdAt");

do $$ begin
  alter table public."Subscription"
    add constraint "Subscription_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."SubscriptionEvent"
    add constraint "SubscriptionEvent_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

alter table public."Subscription" enable row level security;
alter table public."SubscriptionEvent" enable row level security;

drop policy if exists "org_member_read" on public."Subscription";
create policy "org_member_read" on public."Subscription"
  for select
  to authenticated
  using ("organizationId" in (select public.user_organization_ids()));

drop policy if exists "org_member_read" on public."SubscriptionEvent";
create policy "org_member_read" on public."SubscriptionEvent"
  for select
  to authenticated
  using ("organizationId" in (select public.user_organization_ids()));

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'puyer_prisma') then
    grant select, insert, update, delete on table public."Subscription" to puyer_prisma;
    grant select, insert, update, delete on table public."SubscriptionEvent" to puyer_prisma;
    grant usage on type public."SubscriptionStatus" to puyer_prisma;
  end if;
end $$;
