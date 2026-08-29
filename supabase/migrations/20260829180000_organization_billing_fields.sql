-- Manual plan grants on Organization (Table Editor). Idempotent for SQL Editor.

do $$ begin
  create type public."PlanSource" as enum ('STRIPE', 'MANUAL');
exception when duplicate_object then null;
end $$;

alter table public."Organization"
  add column if not exists "planSource" public."PlanSource" not null default 'STRIPE';

alter table public."Organization"
  add column if not exists "subscriptionStatus" public."SubscriptionStatus" not null default 'ACTIVE';

comment on column public."Organization"."plan" is 'Subscription type: FREE, PRO, BUSINESS.';
comment on column public."Organization"."planSource" is 'STRIPE follows Checkout webhooks. MANUAL is a dashboard grant that webhooks do not overwrite.';
comment on column public."Organization"."subscriptionStatus" is 'Billing status used with MANUAL grants (ACTIVE, TRIALING, PAST_DUE, CANCELED, …).';

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'puyer_prisma') then
    grant usage on type public."PlanSource" to puyer_prisma;
  end if;
end $$;
