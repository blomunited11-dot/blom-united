-- BLOM UNITED baseline. Review and apply manually to the dedicated Supabase project.
create extension if not exists pgcrypto;
create type public.publish_state as enum ('draft','review','published','archived');
create table public.sectors(id uuid primary key default gen_random_uuid(),slug text unique not null,sort_order int not null default 0,status public.publish_state not null default 'draft',created_at timestamptz not null default now());
create table public.admin_memberships(user_id uuid primary key references auth.users(id) on delete cascade,role text not null check(role in ('owner','editor','publisher','viewer')),active boolean not null default true);
create table public.sector_grants(user_id uuid references public.admin_memberships(user_id) on delete cascade,sector_id uuid references public.sectors(id) on delete cascade,can_edit boolean not null default false,can_publish boolean not null default false,primary key(user_id,sector_id));
create table public.media_assets(id uuid primary key default gen_random_uuid(),sector_id uuid references public.sectors(id),storage_path text unique not null,public_url text,alt_ar text,alt_en text,created_at timestamptz default now());
create table public.pages(id uuid primary key default gen_random_uuid(),slug text unique not null,sector_id uuid references public.sectors(id),status public.publish_state not null default 'draft',updated_at timestamptz default now());
create table public.services(id uuid primary key default gen_random_uuid(),sector_id uuid not null references public.sectors(id),slug text not null,status public.publish_state not null default 'draft',sort_order int default 0,unique(sector_id,slug));
create table public.projects(id uuid primary key default gen_random_uuid(),sector_id uuid not null references public.sectors(id),slug text unique not null,status public.publish_state not null default 'draft',cover_media_id uuid references public.media_assets(id),published_at timestamptz);
create table public.news(id uuid primary key default gen_random_uuid(),sector_id uuid references public.sectors(id),slug text unique not null,status public.publish_state not null default 'draft',cover_media_id uuid references public.media_assets(id),published_at timestamptz);
create table public.catalog_categories(id uuid primary key default gen_random_uuid(),sector_id uuid not null references public.sectors(id),parent_id uuid references public.catalog_categories(id),slug text not null,status public.publish_state not null default 'draft',unique(sector_id,slug));
create table public.catalog_products(id uuid primary key default gen_random_uuid(),sector_id uuid not null references public.sectors(id),category_id uuid references public.catalog_categories(id),slug text not null,attributes jsonb not null default '{}',status public.publish_state not null default 'draft',unique(sector_id,slug));
create table public.entity_media(id uuid primary key default gen_random_uuid(),entity_type text not null check(entity_type in ('project','service','product','news','sector')),entity_id uuid not null,media_id uuid not null references public.media_assets(id),sort_order int not null default 0);
create table public.content_translations(id uuid primary key default gen_random_uuid(),entity_type text not null check(entity_type in ('page','sector','service','project','news','category','product')),entity_id uuid not null,locale text not null check(locale in ('ar','en')),title text not null,summary text,body jsonb,unique(entity_type,entity_id,locale));
create table public.audit_events(id bigint generated always as identity primary key,actor_id uuid references auth.users(id),action text not null,entity_type text not null,entity_id uuid,created_at timestamptz not null default now());
create or replace function public.is_owner() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.admin_memberships where user_id=auth.uid() and active and role='owner')$$;
create or replace function public.can_manage_sector(s uuid,publish boolean default false) returns boolean language sql stable security definer set search_path=public as $$select public.is_owner() or exists(select 1 from public.admin_memberships m join public.sector_grants g on g.user_id=m.user_id where m.user_id=auth.uid() and m.active and g.sector_id=s and (case when publish then g.can_publish else g.can_edit end))$$;
alter table public.sectors enable row level security;
alter table public.admin_memberships enable row level security;
alter table public.sector_grants enable row level security;
alter table public.media_assets enable row level security;
alter table public.pages enable row level security;
alter table public.services enable row level security;
alter table public.projects enable row level security;
alter table public.news enable row level security;
alter table public.catalog_categories enable row level security;
alter table public.catalog_products enable row level security;
alter table public.entity_media enable row level security;
alter table public.content_translations enable row level security;
alter table public.audit_events enable row level security;
create policy sectors_read on public.sectors for select using(status='published' or public.can_manage_sector(id));
create policy sectors_write on public.sectors for all using(public.is_owner()) with check(public.is_owner());
create policy memberships_read on public.admin_memberships for select using(user_id=auth.uid() or public.is_owner());
create policy memberships_write on public.admin_memberships for all using(public.is_owner()) with check(public.is_owner());
create policy grants_read on public.sector_grants for select using(user_id=auth.uid() or public.is_owner());
create policy grants_write on public.sector_grants for all using(public.is_owner()) with check(public.is_owner());
create policy pages_read on public.pages for select using(status='published' or public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id)));
create policy pages_write on public.pages for all using(public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id))) with check(public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id)));
create policy services_read on public.services for select using(status='published' or public.can_manage_sector(sector_id));
create policy services_write on public.services for all using(public.can_manage_sector(sector_id)) with check(public.can_manage_sector(sector_id));
create policy projects_read on public.projects for select using(status='published' or public.can_manage_sector(sector_id));
create policy projects_write on public.projects for all using(public.can_manage_sector(sector_id)) with check(public.can_manage_sector(sector_id));
create policy news_read on public.news for select using(status='published' or public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id)));
create policy news_write on public.news for all using(public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id))) with check(public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id)));
create policy category_read on public.catalog_categories for select using(status='published' or public.can_manage_sector(sector_id));
create policy category_write on public.catalog_categories for all using(public.can_manage_sector(sector_id)) with check(public.can_manage_sector(sector_id));
create policy product_read on public.catalog_products for select using(status='published' or public.can_manage_sector(sector_id));
create policy product_write on public.catalog_products for all using(public.can_manage_sector(sector_id)) with check(public.can_manage_sector(sector_id));
create policy media_read on public.media_assets for select using(public_url is not null or public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id)));
create policy media_write on public.media_assets for all using(public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id))) with check(public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id)));
create policy translation_read on public.content_translations for select using(
  (entity_type='sector' and exists(select 1 from public.sectors s where s.id=entity_id and s.status='published'))
  or (entity_type='page' and exists(select 1 from public.pages p where p.id=entity_id and p.status='published'))
  or (entity_type='service' and exists(select 1 from public.services s where s.id=entity_id and s.status='published'))
  or (entity_type='project' and exists(select 1 from public.projects p where p.id=entity_id and p.status='published'))
  or (entity_type='news' and exists(select 1 from public.news n where n.id=entity_id and n.status='published'))
  or (entity_type='category' and exists(select 1 from public.catalog_categories c where c.id=entity_id and c.status='published'))
  or (entity_type='product' and exists(select 1 from public.catalog_products p where p.id=entity_id and p.status='published'))
  or public.is_owner()
);
create policy translation_write on public.content_translations for all using(public.is_owner()) with check(public.is_owner());
create policy entity_media_read on public.entity_media for select using(true);
create policy entity_media_write on public.entity_media for all using(public.is_owner()) with check(public.is_owner());
create policy audit_read on public.audit_events for select using(public.is_owner());
-- SECURITY NOTE: editor/publisher enforcement, publication transitions, and scoped translation/media writes
-- require reviewed RPCs and stronger policies before enabling content-management writes in production.
