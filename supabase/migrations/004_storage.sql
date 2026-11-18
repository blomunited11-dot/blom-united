-- Public published imagery bucket. Storage uploads restricted to owner until scoped permissions are reviewed.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('blom-media','blom-media',true,10485760,array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml']) on conflict(id) do nothing;
create policy "blom public images" on storage.objects for select to anon,authenticated using(bucket_id='blom-media');
create policy "blom owner upload" on storage.objects for insert to authenticated with check(bucket_id='blom-media' and public.is_owner());
create policy "blom owner update" on storage.objects for update to authenticated using(bucket_id='blom-media' and public.is_owner()) with check(bucket_id='blom-media' and public.is_owner());
create policy "blom owner delete" on storage.objects for delete to authenticated using(bucket_id='blom-media' and public.is_owner());
