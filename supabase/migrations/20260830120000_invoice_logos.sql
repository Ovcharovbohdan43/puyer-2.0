-- Workspace logos. Public read so payers and PDF generation can load the file.
-- Writes go through the service role from POST /api/logos.

alter table public."Invoice"
  add column if not exists "logoUrl" text not null default '';

alter table public."Invoice"
  add column if not exists "logoScale" integer not null default 100;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-logos',
  'org-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "org_logos_public_read" on storage.objects;
create policy "org_logos_public_read"
on storage.objects
for select
to public
using (bucket_id = 'org-logos');
