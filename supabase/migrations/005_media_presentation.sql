-- Media presentation settings and validated dimensions; additive, existing media remains usable.
alter table public.media_assets add column if not exists width_px integer check(width_px is null or width_px between 1 and 20000);
alter table public.media_assets add column if not exists height_px integer check(height_px is null or height_px between 1 and 20000);
alter table public.media_assets add column if not exists display_ratio text not null default '16/9' check(display_ratio in ('16/9','4/3','1/1','3/4','21/9'));
alter table public.media_assets add column if not exists display_fit text not null default 'cover' check(display_fit in ('cover','contain'));
alter table public.media_assets add column if not exists display_position text not null default 'center' check(display_position in ('center','top','bottom','left','right'));
create index if not exists idx_entity_media_entity_sort on public.entity_media(entity_type,entity_id,sort_order);
