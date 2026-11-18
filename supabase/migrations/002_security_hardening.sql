-- Security hardening for baseline schema. Review before applying to Supabase.
-- No content mutation is granted to non-owner until sector-scoped RPCs are audited.
drop policy if exists entity_media_read on public.entity_media;
create policy entity_media_read on public.entity_media for select using(
 public.is_owner() or
 (entity_type='sector' and exists(select 1 from public.sectors s where s.id=entity_id and s.status='published')) or
 (entity_type='service' and exists(select 1 from public.services s where s.id=entity_id and s.status='published')) or
 (entity_type='project' and exists(select 1 from public.projects p where p.id=entity_id and p.status='published')) or
 (entity_type='news' and exists(select 1 from public.news n where n.id=entity_id and n.status='published')) or
 (entity_type='product' and exists(select 1 from public.catalog_products p where p.id=entity_id and p.status='published'))
);
drop policy if exists media_read on public.media_assets;
create policy media_read on public.media_assets for select using(
 public.is_owner() or exists(select 1 from public.entity_media em where em.media_id=id)
);
drop policy if exists pages_write on public.pages;
create policy pages_write on public.pages for all using(public.is_owner()) with check(public.is_owner());
drop policy if exists services_write on public.services;
create policy services_write on public.services for all using(public.is_owner()) with check(public.is_owner());
drop policy if exists projects_write on public.projects;
create policy projects_write on public.projects for all using(public.is_owner()) with check(public.is_owner());
drop policy if exists news_write on public.news;
create policy news_write on public.news for all using(public.is_owner()) with check(public.is_owner());
drop policy if exists category_write on public.catalog_categories;
create policy category_write on public.catalog_categories for all using(public.is_owner()) with check(public.is_owner());
drop policy if exists product_write on public.catalog_products;
create policy product_write on public.catalog_products for all using(public.is_owner()) with check(public.is_owner());
drop policy if exists media_write on public.media_assets;
create policy media_write on public.media_assets for all using(public.is_owner()) with check(public.is_owner());
-- Prevent any non-owner from publishing through status updates until workflow is implemented.
-- Media and translations are owner-managed for this phase.
-- A membership must be provisioned explicitly after creating an auth user.
