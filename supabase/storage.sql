-- Publicly viewable media, uploaded only through the owner-authenticated server API.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ak-mala-media',
  'ak-mala-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view AK MALA media" on storage.objects;
create policy "Public can view AK MALA media"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'ak-mala-media');

-- No anon/authenticated INSERT, UPDATE, or DELETE policies are created.
-- Owner uploads are proxied by server.ts using the server-only service role.
