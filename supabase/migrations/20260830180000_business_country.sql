-- Workspace business country for Stripe Connect identity (independent of invoice currency).

alter table public."BusinessProfile"
  add column if not exists "defaultCountry" text not null default 'US';

alter table public."BusinessProfile"
  drop constraint if exists "BusinessProfile_defaultCountry_iso";

alter table public."BusinessProfile"
  add constraint "BusinessProfile_defaultCountry_iso"
  check (char_length("defaultCountry") = 2);

alter table public."StripeConnection"
  add column if not exists "identityCountry" text;

alter table public."StripeConnection"
  drop constraint if exists "StripeConnection_identityCountry_iso";

alter table public."StripeConnection"
  add constraint "StripeConnection_identityCountry_iso"
  check ("identityCountry" is null or char_length("identityCountry") = 2);
