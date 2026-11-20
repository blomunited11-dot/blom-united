create or replace function public.save_contracting_copy(
  p_locale text,
  p_values jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_sector_id uuid;
  v_translation record;
  v_field record;
  v_copy jsonb;
  v_value text;
  v_updated_count integer := 0;
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

  if p_locale is null or p_locale not in ('ar', 'en') then
    raise exception 'Invalid locale';
  end if;
  if p_values is null or jsonb_typeof(p_values) <> 'object' then
    raise exception 'Invalid contracting copy';
  end if;
  if exists (
    select 1
    from jsonb_each(p_values) as item(key, value)
    where item.key not in (
      'label', 'title', 'lead', 'intro', 'seeProjects', 'contact',
      'capabilities', 'capIntro', 'domainsTitle', 'workTitle', 'workIntro',
      'lifecycle', 'lifecycleIntro', 'integrated', 'integratedIntro',
      'standards', 'end', 'return'
    )
    or jsonb_typeof(item.value) <> 'string'
    or length(item.value #>> '{}') > 3000
  ) then
    raise exception 'Invalid contracting fields';
  end if;

  select id into v_sector_id
  from public.sectors
  where slug = 'contracting'
  for update;
  if not found then raise exception 'Contracting sector not found'; end if;

  for v_translation in
    select id, body
    from public.content_translations
    where entity_type = 'sector'
      and entity_id = v_sector_id
      and locale = p_locale
    for update
  loop
    v_copy := case
      when jsonb_typeof(v_translation.body -> 'contracting') = 'object'
        then v_translation.body -> 'contracting'
      else '{}'::jsonb
    end;

    for v_field in select key, value from jsonb_each(p_values)
    loop
      v_value := btrim(v_field.value #>> '{}');
      if v_value = '' then
        v_copy := v_copy - v_field.key;
      else
        v_copy := jsonb_set(v_copy, array[v_field.key], to_jsonb(v_value), true);
      end if;
    end loop;

    update public.content_translations
    set body = jsonb_set(
      case
        when jsonb_typeof(v_translation.body) = 'object' then v_translation.body
        else '{}'::jsonb
      end,
      '{contracting}',
      v_copy,
      true
    )
    where id = v_translation.id;

    v_updated_count := v_updated_count + 1;
  end loop;

  if v_updated_count <> 1 then
    raise exception 'Contracting translation not found';
  end if;
end;
$function$;

revoke all on function public.save_contracting_copy(text, jsonb) from public;
grant execute on function public.save_contracting_copy(text, jsonb) to authenticated;

create or replace function public.save_contracting_hero_media(p_media_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_sector_id uuid;
  v_media_sector_id uuid;
  v_public_url text;
  v_translation record;
  v_copy jsonb;
  v_updated_count integer := 0;
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

  select id into v_sector_id
  from public.sectors
  where slug = 'contracting'
  for update;
  if not found then raise exception 'Contracting sector not found'; end if;

  if p_media_id is not null then
    select sector_id, public_url into v_media_sector_id, v_public_url
    from public.media_assets
    where id = p_media_id;
    if not found or v_public_url is null then
      raise exception 'Media not available for this sector';
    end if;
    if v_media_sector_id is not null and v_media_sector_id <> v_sector_id then
      raise exception 'Media not available for this sector';
    end if;
  end if;

  for v_translation in
    select id, body
    from public.content_translations
    where entity_type = 'sector'
      and entity_id = v_sector_id
      and locale in ('ar', 'en')
    order by locale
    for update
  loop
    v_copy := case
      when jsonb_typeof(v_translation.body -> 'contracting') = 'object'
        then v_translation.body -> 'contracting'
      else '{}'::jsonb
    end;

    if p_media_id is null then
      v_copy := v_copy - 'heroMediaId';
    else
      v_copy := jsonb_set(v_copy, '{heroMediaId}', to_jsonb(p_media_id::text), true);
    end if;

    update public.content_translations
    set body = jsonb_set(
      case
        when jsonb_typeof(v_translation.body) = 'object' then v_translation.body
        else '{}'::jsonb
      end,
      '{contracting}',
      v_copy,
      true
    )
    where id = v_translation.id;

    v_updated_count := v_updated_count + 1;
  end loop;

  if v_updated_count <> 2 then
    raise exception 'Both contracting translations are required';
  end if;

  -- The negative slot is reserved for the contracting hero; gallery slots are non-negative.
  delete from public.entity_media
  where entity_type = 'sector'
    and entity_id = v_sector_id
    and sort_order = -1;

  if p_media_id is not null then
    insert into public.entity_media(entity_type, entity_id, media_id, sort_order)
    values ('sector', v_sector_id, p_media_id, -1);
  end if;
end;
$function$;

revoke all on function public.save_contracting_hero_media(uuid) from public;
grant execute on function public.save_contracting_hero_media(uuid) to authenticated;
