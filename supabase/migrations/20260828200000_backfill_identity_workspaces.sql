-- Idempotent handle_new_user + backfill for Auth users created before the trigger.

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
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(split_part(new.email, '@', 1), ''),
    'Workspace'
  );

  insert into public."User" (id, email, name)
  values (new.id, new.email, display_name)
  on conflict (id) do update
    set email = excluded.email;

  if exists (
    select 1 from public."OrganizationMember" where "userId" = new.id
  ) then
    return new;
  end if;

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

revoke execute on function public.handle_new_user() from public, anon, authenticated;

do $$
declare
  r record;
  org_id uuid;
  display_name text;
begin
  for r in
    select u.id, u.email, u.raw_user_meta_data
    from auth.users u
    where not exists (
      select 1 from public."OrganizationMember" m where m."userId" = u.id
    )
  loop
    display_name := coalesce(
      nullif(r.raw_user_meta_data->>'name', ''),
      nullif(split_part(r.email, '@', 1), ''),
      'Workspace'
    );

    insert into public."User" (id, email, name)
    values (r.id, r.email, display_name)
    on conflict (id) do update
      set email = excluded.email;

    insert into public."Organization" (id, name, plan)
    values (gen_random_uuid(), display_name || '''s workspace', 'FREE')
    returning id into org_id;

    insert into public."OrganizationMember" ("userId", "organizationId", role)
    values (r.id, org_id, 'OWNER');

    insert into public."BusinessProfile" ("organizationId", "businessName")
    values (org_id, display_name)
    on conflict ("organizationId") do nothing;

    insert into public."NotificationPreference" ("userId", "organizationId")
    values (r.id, org_id)
    on conflict ("userId", "organizationId") do nothing;
  end loop;
end $$;
