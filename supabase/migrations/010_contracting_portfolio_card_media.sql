alter function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb)
  rename to save_contracting_editor_draft_v1;
alter function public.publish_contracting_editor_draft(text)
  rename to publish_contracting_editor_draft_v1;

revoke all on function public.save_contracting_editor_draft_v1(text,jsonb,uuid,jsonb)
  from public, anon, authenticated;
revoke all on function public.publish_contracting_editor_draft_v1(text)
  from public, anon, authenticated;
revoke all on function public.save_contracting_draft(text,jsonb,uuid)
  from public, anon, authenticated;
revoke all on function public.publish_contracting_draft(text)
  from public, anon, authenticated;

create or replace function public.contracting_editor_base_copy(p_content jsonb)
returns jsonb
language plpgsql
immutable
set search_path = public, pg_temp
as $function$
declare
  v_projects jsonb;
begin
  if jsonb_typeof(p_content) is distinct from 'object'
    or jsonb_typeof(p_content->'projects') is distinct from 'array' then
    return p_content;
  end if;

  select coalesce(
    jsonb_agg(value - 'key' - 'mediaId' order by ordinal),
    '[]'::jsonb
  ) into v_projects
  from jsonb_array_elements(p_content->'projects') with ordinality as item(value,ordinal);

  return jsonb_set(p_content,'{projects}',v_projects,true);
end;
$function$;

create or replace function public.is_valid_contracting_editor_content(p_content jsonb)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $function$
declare
  v_item jsonb;
  v_key text;
  v_media_id jsonb;
  v_seen text[] := '{}';
begin
  if not public.is_valid_contracting_editor_copy(public.contracting_editor_base_copy(p_content))
    or jsonb_typeof(p_content->'projects') is distinct from 'array' then
    return false;
  end if;

  for v_item in select value from jsonb_array_elements(p_content->'projects')
  loop
    if jsonb_typeof(v_item) is distinct from 'object'
      or jsonb_object_length(v_item)<>6
      or exists (
        select 1 from jsonb_object_keys(v_item) as item(key)
        where item.key not in ('key','mediaId','name','category','scope','stages')
      ) then
      return false;
    end if;

    if jsonb_typeof(v_item->'key') is distinct from 'string' then
      return false;
    end if;
    v_key:=v_item->>'key';
    if v_key !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(v_key)>100
      or v_key=any(v_seen) then
      return false;
    end if;
    v_seen:=array_append(v_seen,v_key);

    v_media_id:=v_item->'mediaId';
    if v_media_id is distinct from 'null'::jsonb
      and (jsonb_typeof(v_media_id) is distinct from 'string'
        or v_media_id#>>'{}' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then
      return false;
    end if;
  end loop;

  return true;
end;
$function$;

revoke all on function public.contracting_editor_base_copy(jsonb) from public, anon, authenticated;
revoke all on function public.is_valid_contracting_editor_content(jsonb) from public, anon, authenticated;

create or replace function public.save_contracting_editor_draft(
  p_locale text,
  p_content jsonb,
  p_media_id uuid,
  p_project_media jsonb
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
  v_media_value jsonb;
  v_item jsonb;
begin
  if auth.uid() is null or not public.is_owner() then
    raise exception 'Owner permission required' using errcode = '42501';
  end if;
  if p_locale is null or p_locale not in ('ar','en') then
    raise exception 'Invalid locale';
  end if;
  if not public.is_valid_contracting_editor_content(p_content) then
    raise exception 'Invalid contracting editor content';
  end if;

  select id into v_sector_id from public.sectors where slug='contracting' for update;
  if not found then raise exception 'Contracting sector not found'; end if;

  for v_item in select value from jsonb_array_elements(p_content->'projects')
  loop
    v_media_value:=v_item->'mediaId';
    if v_media_value is distinct from 'null'::jsonb then
      select sector_id,public_url into v_media_sector_id,v_public_url
      from public.media_assets where id=(v_media_value#>>'{}')::uuid;
      if not found or v_public_url is null
        or (v_media_sector_id is not null and v_media_sector_id<>v_sector_id) then
        raise exception 'Media not available for this portfolio card';
      end if;
    end if;
  end loop;

  perform public.save_contracting_editor_draft_v1(
    p_locale,
    public.contracting_editor_base_copy(p_content),
    p_media_id,
    p_project_media
  );
  update public.contracting_content_drafts set content=p_content where locale=p_locale;
  if not found then raise exception 'Unable to save contracting editor content'; end if;
end;
$function$;

create or replace function public.publish_contracting_editor_draft(p_locale text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_sector_id uuid;
  v_content jsonb;
  v_published_content jsonb;
  v_base_content jsonb;
  v_hero_media_id uuid;
  v_media_sector_id uuid;
  v_public_url text;
  v_media_value jsonb;
  v_item jsonb;
  v_body jsonb;
  v_translation_id uuid;
begin
  if auth.uid() is null or not public.is_owner() then
    raise exception 'Owner permission required' using errcode = '42501';
  end if;
  if p_locale is null or p_locale not in ('ar','en') then
    raise exception 'Invalid locale';
  end if;

  select content,hero_media_id into v_content,v_hero_media_id
  from public.contracting_content_drafts where locale=p_locale for update;
  if not found then raise exception 'Save a draft before publishing'; end if;
  if not public.is_valid_contracting_editor_content(v_content) then
    raise exception 'Invalid contracting editor content';
  end if;

  select id into v_sector_id from public.sectors where slug='contracting' for update;
  if not found then raise exception 'Contracting sector not found'; end if;
  for v_item in select value from jsonb_array_elements(v_content->'projects')
  loop
    v_media_value:=v_item->'mediaId';
    if v_media_value is distinct from 'null'::jsonb then
      select sector_id,public_url into v_media_sector_id,v_public_url
      from public.media_assets where id=(v_media_value#>>'{}')::uuid;
      if not found or v_public_url is null
        or (v_media_sector_id is not null and v_media_sector_id<>v_sector_id) then
        raise exception 'Media not available for this portfolio card';
      end if;
    end if;
  end loop;

  v_base_content:=public.contracting_editor_base_copy(v_content);
  update public.contracting_content_drafts set content=v_base_content where locale=p_locale;
  perform public.publish_contracting_editor_draft_v1(p_locale);

  v_published_content:=case when v_hero_media_id is null
    then v_content-'heroMediaId'
    else jsonb_set(v_content,'{heroMediaId}',to_jsonb(v_hero_media_id::text),true)
  end;
  select id,body into v_translation_id,v_body
  from public.content_translations
  where entity_type='sector' and entity_id=v_sector_id and locale=p_locale
  for update;
  if not found then raise exception 'Contracting translation not found'; end if;
  v_body:=case when jsonb_typeof(v_body)='object' then v_body else '{}'::jsonb end;
  update public.content_translations
  set body=jsonb_set(v_body,'{contracting}',v_published_content,true)
  where id=v_translation_id;
  update public.contracting_content_drafts set content=v_content where locale=p_locale;
end;
$function$;

revoke all on function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb) from public;
revoke all on function public.publish_contracting_editor_draft(text) from public;
grant execute on function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb) to authenticated;
grant execute on function public.publish_contracting_editor_draft(text) to authenticated;
