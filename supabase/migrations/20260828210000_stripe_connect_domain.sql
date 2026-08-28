-- Phase 4 Stripe Connect (Domain B). Idempotent for SQL Editor.
-- Invoice payments are a read model of connected-account charges. Puyer does not hold funds.

do $$ begin
  create type "StripeConnectionStatus" as enum (
    'NOT_CONNECTED', 'CONNECTING', 'CONNECTED', 'ACTION_REQUIRED', 'DISCONNECTED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "InvoicePaymentStatus" as enum (
    'PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "StripeWebhookDomain" as enum ('PLATFORM', 'CONNECT');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "WebhookEventStatus" as enum ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');
exception when duplicate_object then null;
end $$;

create table if not exists public."StripeConnection" (
  "id" uuid not null default gen_random_uuid(),
  "organizationId" uuid not null,
  "stripeConnectedAccountId" text not null,
  "status" "StripeConnectionStatus" not null default 'CONNECTING',
  "chargesEnabled" boolean not null default false,
  "payoutsEnabled" boolean not null default false,
  "detailsSubmitted" boolean not null default false,
  "lastAccountUpdatedAt" timestamp(3),
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "StripeConnection_pkey" primary key ("id")
);

create table if not exists public."InvoicePayment" (
  "id" uuid not null default gen_random_uuid(),
  "invoiceId" uuid not null,
  "organizationId" uuid not null,
  "stripeConnectedAccountId" text not null,
  "stripePaymentIntentId" text,
  "stripeCheckoutSessionId" text,
  "amountMinor" bigint not null,
  "currency" text not null,
  "status" "InvoicePaymentStatus" not null default 'PENDING',
  "paidAt" timestamp(3),
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "InvoicePayment_pkey" primary key ("id")
);

create table if not exists public."PaymentEvent" (
  "id" uuid not null default gen_random_uuid(),
  "organizationId" uuid not null,
  "invoiceId" uuid,
  "stripeEventId" text not null,
  "type" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint "PaymentEvent_pkey" primary key ("id")
);

create table if not exists public."WebhookEvent" (
  "id" uuid not null default gen_random_uuid(),
  "eventId" text not null,
  "type" text not null,
  "stripeAccountId" text,
  "domain" "StripeWebhookDomain" not null,
  "payloadHash" text not null,
  "status" "WebhookEventStatus" not null default 'RECEIVED',
  "error" text,
  "processedAt" timestamp(3),
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  "organizationId" uuid,
  constraint "WebhookEvent_pkey" primary key ("id")
);

create unique index if not exists "StripeConnection_organizationId_key"
  on public."StripeConnection"("organizationId");
create unique index if not exists "StripeConnection_stripeConnectedAccountId_key"
  on public."StripeConnection"("stripeConnectedAccountId");
create unique index if not exists "InvoicePayment_stripePaymentIntentId_key"
  on public."InvoicePayment"("stripePaymentIntentId");
create unique index if not exists "InvoicePayment_stripeCheckoutSessionId_key"
  on public."InvoicePayment"("stripeCheckoutSessionId");
create index if not exists "InvoicePayment_organizationId_createdAt_idx"
  on public."InvoicePayment"("organizationId", "createdAt");
create index if not exists "InvoicePayment_invoiceId_idx" on public."InvoicePayment"("invoiceId");
create index if not exists "PaymentEvent_organizationId_createdAt_idx"
  on public."PaymentEvent"("organizationId", "createdAt");
create index if not exists "PaymentEvent_stripeEventId_idx" on public."PaymentEvent"("stripeEventId");
create unique index if not exists "WebhookEvent_eventId_key" on public."WebhookEvent"("eventId");
create index if not exists "WebhookEvent_domain_createdAt_idx"
  on public."WebhookEvent"("domain", "createdAt");

do $$ begin
  alter table public."StripeConnection"
    add constraint "StripeConnection_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."InvoicePayment"
    add constraint "InvoicePayment_invoiceId_fkey"
    foreign key ("invoiceId") references public."Invoice"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."InvoicePayment"
    add constraint "InvoicePayment_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."PaymentEvent"
    add constraint "PaymentEvent_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."PaymentEvent"
    add constraint "PaymentEvent_invoiceId_fkey"
    foreign key ("invoiceId") references public."Invoice"("id") on delete set null on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."WebhookEvent"
    add constraint "WebhookEvent_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete set null on update cascade;
exception when duplicate_object then null;
end $$;

alter table public."StripeConnection" enable row level security;
alter table public."InvoicePayment" enable row level security;
alter table public."PaymentEvent" enable row level security;
alter table public."WebhookEvent" enable row level security;

drop policy if exists "org_member_read" on public."StripeConnection";
create policy "org_member_read" on public."StripeConnection"
  for select
  to authenticated
  using ("organizationId" in (select public.user_organization_ids()));

drop policy if exists "org_member_read" on public."InvoicePayment";
create policy "org_member_read" on public."InvoicePayment"
  for select
  to authenticated
  using ("organizationId" in (select public.user_organization_ids()));

drop policy if exists "org_member_read" on public."PaymentEvent";
create policy "org_member_read" on public."PaymentEvent"
  for select
  to authenticated
  using ("organizationId" in (select public.user_organization_ids()));

-- WebhookEvent is server-only. RLS on, no authenticated policies.

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'puyer_prisma') then
    grant select, insert, update, delete on table public."StripeConnection" to puyer_prisma;
    grant select, insert, update, delete on table public."InvoicePayment" to puyer_prisma;
    grant select, insert, update, delete on table public."PaymentEvent" to puyer_prisma;
    grant select, insert, update, delete on table public."WebhookEvent" to puyer_prisma;
    grant usage on type public."StripeConnectionStatus" to puyer_prisma;
    grant usage on type public."InvoicePaymentStatus" to puyer_prisma;
    grant usage on type public."StripeWebhookDomain" to puyer_prisma;
    grant usage on type public."WebhookEventStatus" to puyer_prisma;
  end if;
end $$;
