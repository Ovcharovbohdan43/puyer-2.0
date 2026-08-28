-- Phase 2 invoice domain. Idempotent for SQL Editor.
-- Prisma: npx prisma generate
-- If using migrate history: npx prisma migrate resolve --applied 20260828180000_invoice_domain

do $$ begin
  create type "InvoiceStatus" as enum (
    'DRAFT', 'READY', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "DiscountType" as enum ('NONE', 'PERCENT', 'FIXED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "InvoiceTemplate" as enum ('MINIMAL', 'PROFESSIONAL', 'PREMIUM');
exception when duplicate_object then null;
end $$;

create table if not exists public."Client" (
  "id" uuid not null default gen_random_uuid(),
  "organizationId" uuid not null,
  "name" text not null,
  "email" text not null default '',
  "address" text not null default '',
  "taxNumber" text not null default '',
  "phone" text not null default '',
  "notes" text not null default '',
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "Client_pkey" primary key ("id")
);

create table if not exists public."Product" (
  "id" uuid not null default gen_random_uuid(),
  "organizationId" uuid not null,
  "name" text not null,
  "description" text not null default '',
  "defaultPriceMinor" bigint not null default 0,
  "defaultTaxRate" numeric(7, 4) not null default 0,
  "currency" text not null default 'USD',
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "Product_pkey" primary key ("id")
);

create table if not exists public."InvoiceSequence" (
  "organizationId" uuid not null,
  "nextNumber" integer not null default 1,
  constraint "InvoiceSequence_pkey" primary key ("organizationId")
);

create table if not exists public."Invoice" (
  "id" uuid not null default gen_random_uuid(),
  "organizationId" uuid not null,
  "clientId" uuid not null,
  "createdByUserId" uuid,
  "publicId" text not null,
  "invoiceNumber" text not null,
  "status" "InvoiceStatus" not null default 'DRAFT',
  "currency" text not null default 'USD',
  "issueDate" date not null,
  "dueDate" date not null,
  "businessName" text not null,
  "businessAddress" text not null default '',
  "clientName" text not null,
  "clientAddress" text not null default '',
  "discountType" "DiscountType" not null default 'NONE',
  "discountValue" text not null default '0',
  "taxRate" text not null default '0',
  "notes" text not null default '',
  "paymentDetails" text not null default '',
  "template" "InvoiceTemplate" not null default 'PROFESSIONAL',
  "accentColor" text not null default '#000000',
  "subtotalMinor" bigint not null default 0,
  "discountAmountMinor" bigint not null default 0,
  "taxAmountMinor" bigint not null default 0,
  "totalMinor" bigint not null default 0,
  "sentAt" timestamp(3),
  "viewedAt" timestamp(3),
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "Invoice_pkey" primary key ("id")
);

create table if not exists public."InvoiceItem" (
  "id" uuid not null default gen_random_uuid(),
  "invoiceId" uuid not null,
  "productId" uuid,
  "description" text not null,
  "quantityMinor" bigint not null,
  "unitPriceMinor" bigint not null,
  "amountMinor" bigint not null,
  "sortOrder" integer not null default 0,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "InvoiceItem_pkey" primary key ("id")
);

create unique index if not exists "Invoice_publicId_key" on public."Invoice"("publicId");
create unique index if not exists "Invoice_organizationId_invoiceNumber_key"
  on public."Invoice"("organizationId", "invoiceNumber");
create index if not exists "Client_organizationId_idx" on public."Client"("organizationId");
create index if not exists "Client_organizationId_name_idx" on public."Client"("organizationId", "name");
create index if not exists "Product_organizationId_idx" on public."Product"("organizationId");
create index if not exists "Invoice_organizationId_createdAt_idx"
  on public."Invoice"("organizationId", "createdAt");
create index if not exists "Invoice_organizationId_status_dueDate_idx"
  on public."Invoice"("organizationId", "status", "dueDate");
create index if not exists "Invoice_clientId_idx" on public."Invoice"("clientId");
create index if not exists "InvoiceItem_invoiceId_idx" on public."InvoiceItem"("invoiceId");
create index if not exists "InvoiceItem_productId_idx" on public."InvoiceItem"("productId");

do $$ begin
  alter table public."Client"
    add constraint "Client_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."Product"
    add constraint "Product_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."InvoiceSequence"
    add constraint "InvoiceSequence_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."Invoice"
    add constraint "Invoice_organizationId_fkey"
    foreign key ("organizationId") references public."Organization"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."Invoice"
    add constraint "Invoice_clientId_fkey"
    foreign key ("clientId") references public."Client"("id") on delete restrict on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."Invoice"
    add constraint "Invoice_createdByUserId_fkey"
    foreign key ("createdByUserId") references public."User"("id") on delete set null on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."InvoiceItem"
    add constraint "InvoiceItem_invoiceId_fkey"
    foreign key ("invoiceId") references public."Invoice"("id") on delete cascade on update cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public."InvoiceItem"
    add constraint "InvoiceItem_productId_fkey"
    foreign key ("productId") references public."Product"("id") on delete set null on update cascade;
exception when duplicate_object then null;
end $$;

alter table public."Client" enable row level security;
alter table public."Product" enable row level security;
alter table public."InvoiceSequence" enable row level security;
alter table public."Invoice" enable row level security;
alter table public."InvoiceItem" enable row level security;

drop policy if exists "org_member_all" on public."Client";
create policy "org_member_all" on public."Client"
  for all
  to authenticated
  using ("organizationId" in (select public.user_organization_ids()))
  with check ("organizationId" in (select public.user_organization_ids()));

drop policy if exists "org_member_all" on public."Product";
create policy "org_member_all" on public."Product"
  for all
  to authenticated
  using ("organizationId" in (select public.user_organization_ids()))
  with check ("organizationId" in (select public.user_organization_ids()));

drop policy if exists "org_member_all" on public."InvoiceSequence";
create policy "org_member_all" on public."InvoiceSequence"
  for all
  to authenticated
  using ("organizationId" in (select public.user_organization_ids()))
  with check ("organizationId" in (select public.user_organization_ids()));

drop policy if exists "org_member_all" on public."Invoice";
create policy "org_member_all" on public."Invoice"
  for all
  to authenticated
  using ("organizationId" in (select public.user_organization_ids()))
  with check ("organizationId" in (select public.user_organization_ids()));

drop policy if exists "org_member_all" on public."InvoiceItem";
create policy "org_member_all" on public."InvoiceItem"
  for all
  to authenticated
  using (
    "invoiceId" in (
      select id from public."Invoice"
      where "organizationId" in (select public.user_organization_ids())
    )
  )
  with check (
    "invoiceId" in (
      select id from public."Invoice"
      where "organizationId" in (select public.user_organization_ids())
    )
  );

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'puyer_prisma') then
    grant select, insert, update, delete on table public."Client" to puyer_prisma;
    grant select, insert, update, delete on table public."Product" to puyer_prisma;
    grant select, insert, update, delete on table public."InvoiceSequence" to puyer_prisma;
    grant select, insert, update, delete on table public."Invoice" to puyer_prisma;
    grant select, insert, update, delete on table public."InvoiceItem" to puyer_prisma;
    grant usage on type public."InvoiceStatus" to puyer_prisma;
    grant usage on type public."DiscountType" to puyer_prisma;
    grant usage on type public."InvoiceTemplate" to puyer_prisma;
  end if;
end $$;
