-- Workspace setup after first magic-link sign-in.
-- Backfill only when the column is first added so a later re-run cannot mark new users complete.

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'User'
      and column_name = 'onboardingCompletedAt'
  ) then
    alter table public."User" add column "onboardingCompletedAt" timestamp(3);
    update public."User" set "onboardingCompletedAt" = "createdAt";
  end if;
end $$;
