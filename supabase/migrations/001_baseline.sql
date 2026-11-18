-- BLOM UNITED baseline: rerunnable baseline; replaces named RLS policies with the baseline definitions. 
-- Existing table structures and policy definitions must still be verified before production.
create extension if not exists pgcrypto;
DO $enum_guard$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='publish_state') THEN
    CREATE TYPE public.publish_state AS ENUM ('draft','review','published','archived');
  END IF;
  IF (SELECT array_agg(e.enumlabel::text ORDER BY e.enumsortorder) FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid WHERE n.nspname='public' AND t.typname='publish_state')
    IS DISTINCT FROM ARRAY['draft','review','published','archived']::text[] THEN
    RAISE EXCEPTION 'Existing public.publish_state values differ from the required values; manual review needed';
  END IF;
END $enum_guard$;
create table if not exists public.sectors(id uuid primary key default gen_random_uuid(),slug text unique not null,sort_order int not null default 0,status public.publish_state not null default 'draft',created_at timestamptz not null default now());
create table if not exists public.admin_memberships(user_id uuid primary key references auth.users(id) on delete cascade,role text not null check(role in ('owner','editor','publisher','viewer')),active boolean not null default true);
create table if not exists public.sector_grants(user_id uuid references public.admin_memberships(user_id) on delete cascade,sector_id uuid references public.sectors(id) on delete cascade,can_edit boolean not null default false,can_publish boolean not null default false,primary key(user_id,sector_id));
create table if not exists public.media_assets(id uuid primary key default gen_random_uuid(),sector_id uuid references public.sectors(id),storage_path text unique not null,public_url text,alt_ar text,alt_en text,created_at timestamptz default now());
create table if not exists public.pages(id uuid primary key default gen_random_uuid(),slug text unique not null,sector_id uuid references public.sectors(id),status public.publish_state not null default 'draft',updated_at timestamptz default now());
create table if not exists public.services(id uuid primary key default gen_random_uuid(),sector_id uuid not null references public.sectors(id),slug text not null,status public.publish_state not null default 'draft',sort_order int default 0,unique(sector_id,slug));
create table if not exists public.projects(id uuid primary key default gen_random_uuid(),sector_id uuid not null references public.sectors(id),slug text unique not null,status public.publish_state not null default 'draft',cover_media_id uuid references public.media_assets(id),published_at timestamptz);
create table if not exists public.news(id uuid primary key default gen_random_uuid(),sector_id uuid references public.sectors(id),slug text unique not null,status public.publish_state not null default 'draft',cover_media_id uuid references public.media_assets(id),published_at timestamptz);
create table if not exists public.catalog_categories(id uuid primary key default gen_random_uuid(),sector_id uuid not null references public.sectors(id),parent_id uuid references public.catalog_categories(id),slug text not null,status public.publish_state not null default 'draft',unique(sector_id,slug));
create table if not exists public.catalog_products(id uuid primary key default gen_random_uuid(),sector_id uuid not null references public.sectors(id),category_id uuid references public.catalog_categories(id),slug text not null,attributes jsonb not null default '{}',status public.publish_state not null default 'draft',unique(sector_id,slug));
create table if not exists public.entity_media(id uuid primary key default gen_random_uuid(),entity_type text not null check(entity_type in ('project','service','product','news','sector')),entity_id uuid not null,media_id uuid not null references public.media_assets(id),sort_order int not null default 0);
create table if not exists public.content_translations(id uuid primary key default gen_random_uuid(),entity_type text not null check(entity_type in ('page','sector','service','project','news','category','product')),entity_id uuid not null,locale text not null check(locale in ('ar','en')),title text not null,summary text,body jsonb,unique(entity_type,entity_id,locale));
create table if not exists public.audit_events(id bigint generated always as identity primary key,actor_id uuid references auth.users(id),action text not null,entity_type text not null,entity_id uuid,created_at timestamptz not null default now());
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
DROP POLICY IF EXISTS sectors_read ON public.sectors;
CREATE POLICY sectors_read ON public.sectors for select using(status='published' or public.can_manage_sector(id));
DROP POLICY IF EXISTS sectors_write ON public.sectors;
CREATE POLICY sectors_write ON public.sectors for all using(public.is_owner()) with check(public.is_owner());
DROP POLICY IF EXISTS memberships_read ON public.admin_memberships;
CREATE POLICY memberships_read ON public.admin_memberships for select using(user_id=auth.uid() or public.is_owner());
DROP POLICY IF EXISTS memberships_write ON public.admin_memberships;
CREATE POLICY memberships_write ON public.admin_memberships for all using(public.is_owner()) with check(public.is_owner());
DROP POLICY IF EXISTS grants_read ON public.sector_grants;
CREATE POLICY grants_read ON public.sector_grants for select using(user_id=auth.uid() or public.is_owner());
DROP POLICY IF EXISTS grants_write ON public.sector_grants;
CREATE POLICY grants_write ON public.sector_grants for all using(public.is_owner()) with check(public.is_owner());
DROP POLICY IF EXISTS pages_read ON public.pages;
CREATE POLICY pages_read ON public.pages for select using(status='published' or public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id)));
DROP POLICY IF EXISTS pages_write ON public.pages;
CREATE POLICY pages_write ON public.pages for all using(public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id))) with check(public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id)));
DROP POLICY IF EXISTS services_read ON public.services;
CREATE POLICY services_read ON public.services for select using(status='published' or public.can_manage_sector(sector_id));
DROP POLICY IF EXISTS services_write ON public.services;
CREATE POLICY services_write ON public.services for all using(public.can_manage_sector(sector_id)) with check(public.can_manage_sector(sector_id));
DROP POLICY IF EXISTS projects_read ON public.projects;
CREATE POLICY projects_read ON public.projects for select using(status='published' or public.can_manage_sector(sector_id));
DROP POLICY IF EXISTS projects_write ON public.projects;
CREATE POLICY projects_write ON public.projects for all using(public.can_manage_sector(sector_id)) with check(public.can_manage_sector(sector_id));
DROP POLICY IF EXISTS news_read ON public.news;
CREATE POLICY news_read ON public.news for select using(status='published' or public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id)));
DROP POLICY IF EXISTS news_write ON public.news;
CREATE POLICY news_write ON public.news for all using(public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id))) with check(public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id)));
DROP POLICY IF EXISTS category_read ON public.catalog_categories;
CREATE POLICY category_read ON public.catalog_categories for select using(status='published' or public.can_manage_sector(sector_id));
DROP POLICY IF EXISTS category_write ON public.catalog_categories;
CREATE POLICY category_write ON public.catalog_categories for all using(public.can_manage_sector(sector_id)) with check(public.can_manage_sector(sector_id));
DROP POLICY IF EXISTS product_read ON public.catalog_products;
CREATE POLICY product_read ON public.catalog_products for select using(status='published' or public.can_manage_sector(sector_id));
DROP POLICY IF EXISTS product_write ON public.catalog_products;
CREATE POLICY product_write ON public.catalog_products for all using(public.can_manage_sector(sector_id)) with check(public.can_manage_sector(sector_id));
DROP POLICY IF EXISTS media_read ON public.media_assets;
CREATE POLICY media_read ON public.media_assets for select using(public_url is not null or public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id)));
DROP POLICY IF EXISTS media_write ON public.media_assets;
CREATE POLICY media_write ON public.media_assets for all using(public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id))) with check(public.is_owner() or (sector_id is not null and public.can_manage_sector(sector_id)));
DROP POLICY IF EXISTS translation_read ON public.content_translations;
CREATE POLICY translation_read ON public.content_translations for select using(
  (entity_type='sector' and exists(select 1 from public.sectors s where s.id=entity_id and s.status='published'))
  or (entity_type='page' and exists(select 1 from public.pages p where p.id=entity_id and p.status='published'))
  or (entity_type='service' and exists(select 1 from public.services s where s.id=entity_id and s.status='published'))
  or (entity_type='project' and exists(select 1 from public.projects p where p.id=entity_id and p.status='published'))
  or (entity_type='news' and exists(select 1 from public.news n where n.id=entity_id and n.status='published'))
  or (entity_type='category' and exists(select 1 from public.catalog_categories c where c.id=entity_id and c.status='published'))
  or (entity_type='product' and exists(select 1 from public.catalog_products p where p.id=entity_id and p.status='published'))
  or public.is_owner()
);
DROP POLICY IF EXISTS translation_write ON public.content_translations;
CREATE POLICY translation_write ON public.content_translations for all using(public.is_owner()) with check(public.is_owner());
DROP POLICY IF EXISTS entity_media_read ON public.entity_media;
CREATE POLICY entity_media_read ON public.entity_media for select using(true);
DROP POLICY IF EXISTS entity_media_write ON public.entity_media;
CREATE POLICY entity_media_write ON public.entity_media for all using(public.is_owner()) with check(public.is_owner());
DROP POLICY IF EXISTS audit_read ON public.audit_events;
CREATE POLICY audit_read ON public.audit_events for select using(public.is_owner());
-- SECURITY NOTE: editor/publisher enforcement, publication transitions, and scoped translation/media writes
-- require reviewed RPCs and stronger policies before enabling content-management writes in production.
