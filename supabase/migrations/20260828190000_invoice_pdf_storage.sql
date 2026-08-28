-- Private PDF bucket. Service role uploads; no anon/authenticated object policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invoice-pdfs',
  'invoice-pdfs',
  false,
  5242880,
  array['application/pdf']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
