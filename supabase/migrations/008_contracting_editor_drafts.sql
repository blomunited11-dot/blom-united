create table if not exists public.contracting_content_drafts (
  locale text primary key check (locale in ('ar', 'en')),
  content jsonb not null,
  hero_media_id uuid references public.media_assets(id) on delete set null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.contracting_content_drafts enable row level security;
drop policy if exists contracting_drafts_owner_read on public.contracting_content_drafts;
create policy contracting_drafts_owner_read
  on public.contracting_content_drafts for select
  using (public.is_owner());
revoke all on public.contracting_content_drafts from anon, authenticated;
grant select on public.contracting_content_drafts to authenticated;

create or replace function public.is_valid_contracting_editor_copy(p_content jsonb)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $function$
declare
  v_key text;
  v_item jsonb;
  v_page jsonb;
  v_slug text;
  v_value jsonb;
  v_scalar_keys constant text[] := array[
    'title','label','lead','intro','seeProjects','contact','photo','pending',
    'capabilities','capIntro','domainsTitle','workTitle','workIntro',
    'lifecycle','lifecycleIntro','integrated','integratedIntro','standards',
    'published','publishedServices','more','return','end'
  ];
  v_page_slugs constant text[] := array[
    'general-contracting','structural-concrete','operation-maintenance',
    'architectural-finishing','mep-systems','infrastructure','projects',
    'project-lifecycle','quality-safety','integrated-delivery','contact'
  ];
begin
  if p_content is null or jsonb_typeof(p_content) <> 'object'
    or jsonb_object_length(p_content) <> 30 then
    return false;
  end if;

  if exists (
    select 1 from jsonb_object_keys(p_content) as item(key)
    where item.key not in (
      'title','label','lead','intro','seeProjects','contact','photo','pending',
      'capabilities','capIntro','domainsTitle','workTitle','workIntro',
      'lifecycle','lifecycleIntro','integrated','integratedIntro','standards',
      'published','publishedServices','more','return','end','services','domains',
      'projects','steps','integratedItems','standardsItems','pages'
    )
  ) then
    return false;
  end if;

  foreach v_key in array v_scalar_keys loop
    v_value := p_content -> v_key;
    if jsonb_typeof(v_value) <> 'string'
      or length(btrim(v_value #>> '{}')) = 0
      or length(v_value #>> '{}') > 3000 then
      return false;
    end if;
  end loop;

  if jsonb_typeof(p_content -> 'services') <> 'array'
    or jsonb_array_length(p_content -> 'services') <> 6
    or jsonb_typeof(p_content -> 'domains') <> 'array'
    or jsonb_array_length(p_content -> 'domains') not between 1 and 20
    or jsonb_typeof(p_content -> 'steps') <> 'array'
    or jsonb_array_length(p_content -> 'steps') not between 1 and 20
    or jsonb_typeof(p_content -> 'integratedItems') <> 'array'
    or jsonb_array_length(p_content -> 'integratedItems') not between 1 and 20 then
    return false;
  end if;

  foreach v_key in array array['services','domains','steps','integratedItems'] loop
    for v_value in select value from jsonb_array_elements(p_content -> v_key)
    loop
      if jsonb_typeof(v_value) <> 'string'
        or length(btrim(v_value #>> '{}')) = 0
        or length(v_value #>> '{}') > 3000 then
        return false;
      end if;
    end loop;
  end loop;

  if jsonb_typeof(p_content -> 'projects') <> 'array'
    or jsonb_array_length(p_content -> 'projects') not between 1 and 30 then
    return false;
  end if;
  for v_item in select value from jsonb_array_elements(p_content -> 'projects')
  loop
    if jsonb_typeof(v_item) <> 'object' or jsonb_object_length(v_item) <> 4
      or exists (
        select 1 from jsonb_object_keys(v_item) as item(key)
        where item.key not in ('name','category','scope','stages')
      ) then
      return false;
    end if;
    foreach v_key in array array['name','category','scope'] loop
      v_value := v_item -> v_key;
      if jsonb_typeof(v_value) <> 'string'
        or length(btrim(v_value #>> '{}')) = 0
        or length(v_value #>> '{}') > 3000 then
        return false;
      end if;
    end loop;
    if jsonb_typeof(v_item -> 'stages') <> 'array'
      or jsonb_array_length(v_item -> 'stages') not between 1 and 10 then
      return false;
    end if;
    for v_value in select value from jsonb_array_elements(v_item -> 'stages')
    loop
      if jsonb_typeof(v_value) <> 'string'
        or length(btrim(v_value #>> '{}')) = 0
        or length(v_value #>> '{}') > 3000 then
        return false;
      end if;
    end loop;
  end loop;

  if jsonb_typeof(p_content -> 'standardsItems') <> 'array'
    or jsonb_array_length(p_content -> 'standardsItems') not between 1 and 10 then
    return false;
  end if;
  for v_item in select value from jsonb_array_elements(p_content -> 'standardsItems')
  loop
    if jsonb_typeof(v_item) <> 'object' or jsonb_object_length(v_item) <> 2
      or exists (
        select 1 from jsonb_object_keys(v_item) as item(key)
        where item.key not in ('name','text')
      ) then
      return false;
    end if;
    foreach v_key in array array['name','text'] loop
      v_value := v_item -> v_key;
      if jsonb_typeof(v_value) <> 'string'
        or length(btrim(v_value #>> '{}')) = 0
        or length(v_value #>> '{}') > 3000 then
        return false;
      end if;
    end loop;
  end loop;

  if jsonb_typeof(p_content -> 'pages') <> 'object'
    or jsonb_object_length(p_content -> 'pages') <> cardinality(v_page_slugs) then
    return false;
  end if;
  foreach v_slug in array v_page_slugs loop
    if not ((p_content -> 'pages') ? v_slug) then
      return false;
    end if;
    v_page := p_content -> 'pages' -> v_slug;
    if jsonb_typeof(v_page) <> 'object' or jsonb_object_length(v_page) <> 2
      or exists (
        select 1 from jsonb_object_keys(v_page) as item(key)
        where item.key not in ('title','description')
      ) then
      return false;
    end if;
    foreach v_key in array array['title','description'] loop
      v_value := v_page -> v_key;
      if jsonb_typeof(v_value) <> 'string'
        or length(btrim(v_value #>> '{}')) = 0
        or length(v_value #>> '{}') > 3000 then
        return false;
      end if;
    end loop;
  end loop;
  return true;
end;
$function$;

revoke all on function public.is_valid_contracting_editor_copy(jsonb) from public;

create or replace function public.save_contracting_draft(
  p_locale text,
  p_content jsonb,
  p_media_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_sector_id uuid;
  v_media_sector_id uuid;
  v_public_url text;
begin
  if auth.uid() is null or not public.is_owner() then
    raise exception 'Owner permission required' using errcode = '42501';
  end if;
  if p_locale is null or p_locale not in ('ar','en') then
    raise exception 'Invalid locale';
  end if;
  if not public.is_valid_contracting_editor_copy(p_content) then
    raise exception 'Invalid contracting editor content';
  end if;

  select id into v_sector_id from public.sectors where slug='contracting' for update;
  if not found then raise exception 'Contracting sector not found'; end if;

  if p_media_id is not null then
    select sector_id,public_url into v_media_sector_id,v_public_url
    from public.media_assets where id=p_media_id;
    if not found or v_public_url is null
      or (v_media_sector_id is not null and v_media_sector_id<>v_sector_id) then
      raise exception 'Media not available for this sector';
    end if;
  end if;

  insert into public.contracting_content_drafts(locale,content,hero_media_id,updated_by,updated_at)
  values(p_locale,p_content,p_media_id,auth.uid(),now())
  on conflict(locale) do update set
    content=excluded.content,
    hero_media_id=excluded.hero_media_id,
    updated_by=excluded.updated_by,
    updated_at=excluded.updated_at;
end;
$function$;

create or replace function public.publish_contracting_draft(p_locale text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_sector_id uuid;
  v_media_sector_id uuid;
  v_public_url text;
  v_content jsonb;
  v_media_id uuid;
  v_translation record;
  v_copy jsonb;
  v_body jsonb;
  v_updated_count integer := 0;
  v_translation_count integer;
begin
  if auth.uid() is null or not public.is_owner() then
    raise exception 'Owner permission required' using errcode = '42501';
  end if;
  if p_locale is null or p_locale not in ('ar','en') then
    raise exception 'Invalid locale';
  end if;

  select id into v_sector_id from public.sectors where slug='contracting' for update;
  if not found then raise exception 'Contracting sector not found'; end if;
  select content,hero_media_id into v_content,v_media_id
  from public.contracting_content_drafts where locale=p_locale for update;
  if not found then raise exception 'Save a draft before publishing'; end if;
  if not public.is_valid_contracting_editor_copy(v_content) then
    raise exception 'Invalid contracting editor content';
  end if;
  if v_media_id is not null then
    select sector_id,public_url into v_media_sector_id,v_public_url
    from public.media_assets where id=v_media_id;
    if not found or v_public_url is null
      or (v_media_sector_id is not null and v_media_sector_id<>v_sector_id) then
      raise exception 'Media not available for this sector';
    end if;
  end if;

  select count(*) into v_translation_count from public.content_translations
  where entity_type='sector' and entity_id=v_sector_id and locale in ('ar','en');
  if v_translation_count<>2 then
    raise exception 'Both contracting translations are required';
  end if;

  for v_translation in
    select id,locale,body from public.content_translations
    where entity_type='sector' and entity_id=v_sector_id and locale in ('ar','en')
    order by locale for update
  loop
    v_body:=case when jsonb_typeof(v_translation.body)='object' then v_translation.body else '{}'::jsonb end;
    if v_translation.locale=p_locale then
      v_copy:=v_content;
    else
      v_copy:=case when jsonb_typeof(v_body->'contracting')='object' then v_body->'contracting' else '{}'::jsonb end;
    end if;
    if v_media_id is null then
      v_copy:=v_copy-'heroMediaId';
    else
      v_copy:=jsonb_set(v_copy,'{heroMediaId}',to_jsonb(v_media_id::text),true);
    end if;
    update public.content_translations set body=jsonb_set(v_body,'{contracting}',v_copy,true)
    where id=v_translation.id;
    v_updated_count:=v_updated_count+1;
  end loop;
  if v_updated_count<>2 then raise exception 'Both contracting translations are required'; end if;

  delete from public.entity_media
  where entity_type='sector' and entity_id=v_sector_id and sort_order=-1;
  if v_media_id is not null then
    insert into public.entity_media(entity_type,entity_id,media_id,sort_order)
    values('sector',v_sector_id,v_media_id,-1);
  end if;
end;
$function$;

revoke all on function public.save_contracting_draft(text,jsonb,uuid) from public;
revoke all on function public.publish_contracting_draft(text) from public;
grant execute on function public.save_contracting_draft(text,jsonb,uuid) to authenticated;
grant execute on function public.publish_contracting_draft(text) to authenticated;

drop policy if exists translation_write on public.content_translations;
create policy translation_write
  on public.content_translations for all
  using (
    public.is_owner()
    and not (
      entity_type='sector'
      and exists (
        select 1 from public.sectors
        where id=entity_id and slug='contracting'
      )
    )
  )
  with check (
    public.is_owner()
    and not (
      entity_type='sector'
      and exists (
        select 1 from public.sectors
        where id=entity_id and slug='contracting'
      )
    )
  );

revoke all on function public.save_contracting_copy(text,jsonb) from authenticated;
revoke all on function public.save_contracting_hero_media(uuid) from authenticated;
