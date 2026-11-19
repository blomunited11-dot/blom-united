create or replace function public.update_managed_entry(
  p_table text,
  p_id uuid,
  p_slug text,
  p_status text,
  p_sector_id uuid,
  p_sort_order integer,
  p_category_id uuid,
  p_title_ar text,
  p_summary_ar text,
  p_title_en text,
  p_summary_en text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_entity_type text;
  v_existing_slug text;
  v_row_count integer;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.admin_memberships
    where user_id = auth.uid()
      and active
      and role = 'owner'
  ) then
    raise exception 'Owner permission required' using errcode = '42501';
  end if;

  if p_table is null or p_table not in (
    'sectors', 'services', 'projects', 'news', 'pages',
    'catalog_categories', 'catalog_products'
  ) then
    raise exception 'Invalid entity';
  end if;
  if p_id is null then raise exception 'Invalid id'; end if;
  if p_slug is null or p_slug !~ '^[a-z0-9-]{2,80}$' then
    raise exception 'Invalid slug';
  end if;
  if p_status is null or p_status not in ('draft', 'review', 'published', 'archived') then
    raise exception 'Invalid status';
  end if;
  if p_title_ar is null or length(btrim(p_title_ar)) = 0 or length(p_title_ar) > 250
    or p_title_en is null or length(btrim(p_title_en)) = 0 or length(p_title_en) > 250 then
    raise exception 'Both titles are required and must be at most 250 characters';
  end if;
  if p_summary_ar is null or length(p_summary_ar) > 3000
    or p_summary_en is null or length(p_summary_en) > 3000 then
    raise exception 'Summaries must be at most 3000 characters';
  end if;

  if p_table = 'pages' then
    select slug into v_existing_slug from public.pages where id = p_id;
    if not found then raise exception 'Entry not found'; end if;
    if lower(v_existing_slug) in ('home', 'homepage', 'index', 'landing', 'main')
      or lower(p_slug) in ('home', 'homepage', 'index', 'landing', 'main') then
      raise exception 'The group home page is protected';
    end if;
  end if;

  if p_table in ('services', 'projects', 'catalog_categories', 'catalog_products')
    and p_sector_id is null then
    raise exception 'Sector required';
  end if;
  if p_table = 'sectors' and p_sector_id is not null then
    raise exception 'Sector cannot be assigned to a sector';
  end if;
  if p_sector_id is not null and p_table <> 'sectors'
    and not exists (select 1 from public.sectors where id = p_sector_id) then
    raise exception 'Sector not found';
  end if;
  if p_table in ('sectors', 'services') then
    if p_sort_order is null or p_sort_order < 0 or p_sort_order > 9999 then
      raise exception 'Invalid order';
    end if;
  elsif p_sort_order is not null then
    raise exception 'Order is not editable for this entity';
  end if;
  if p_table = 'catalog_products' then
    if p_category_id is not null and not exists (
      select 1 from public.catalog_categories
      where id = p_category_id and sector_id = p_sector_id
    ) then
      raise exception 'Category must belong to the selected sector';
    end if;
  elsif p_category_id is not null then
    raise exception 'Category is not applicable to this entity';
  end if;

  v_entity_type := case p_table
    when 'sectors' then 'sector'
    when 'services' then 'service'
    when 'projects' then 'project'
    when 'news' then 'news'
    when 'pages' then 'page'
    when 'catalog_categories' then 'category'
    when 'catalog_products' then 'product'
  end;

  select count(*) into v_row_count
  from public.content_translations
  where entity_type = v_entity_type
    and entity_id = p_id
    and locale in ('ar', 'en');
  if v_row_count <> 2 then
    raise exception 'Missing translation row; no changes made';
  end if;

  if p_table = 'sectors' then
    update public.sectors
    set slug = p_slug, status = p_status::public.publish_state, sort_order = p_sort_order
    where id = p_id;
  elsif p_table = 'services' then
    update public.services
    set slug = p_slug, status = p_status::public.publish_state,
        sector_id = p_sector_id, sort_order = p_sort_order
    where id = p_id;
  elsif p_table = 'projects' then
    update public.projects
    set slug = p_slug, status = p_status::public.publish_state, sector_id = p_sector_id
    where id = p_id;
  elsif p_table = 'news' then
    update public.news
    set slug = p_slug, status = p_status::public.publish_state, sector_id = p_sector_id
    where id = p_id;
  elsif p_table = 'pages' then
    update public.pages
    set slug = p_slug, status = p_status::public.publish_state, sector_id = p_sector_id
    where id = p_id;
  elsif p_table = 'catalog_categories' then
    update public.catalog_categories
    set slug = p_slug, status = p_status::public.publish_state, sector_id = p_sector_id
    where id = p_id;
  else
    update public.catalog_products
    set slug = p_slug, status = p_status::public.publish_state,
        sector_id = p_sector_id, category_id = p_category_id
    where id = p_id;
  end if;

  get diagnostics v_row_count = row_count;
  if v_row_count <> 1 then raise exception 'Entry not found'; end if;

  update public.content_translations
  set title = case locale when 'ar' then btrim(p_title_ar) else btrim(p_title_en) end,
      summary = case locale when 'ar' then btrim(p_summary_ar) else btrim(p_summary_en) end
  where entity_type = v_entity_type
    and entity_id = p_id
    and locale in ('ar', 'en');
  get diagnostics v_row_count = row_count;
  if v_row_count <> 2 then raise exception 'Translation update incomplete'; end if;
end;
$function$;

revoke all on function public.update_managed_entry(
  text, uuid, text, text, uuid, integer, uuid, text, text, text, text
) from public;
grant execute on function public.update_managed_entry(
  text, uuid, text, text, uuid, integer, uuid, text, text, text, text
) to authenticated;
