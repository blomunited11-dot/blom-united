-- Repair first-time contracting publication without discarding drafts or media.
-- Apply in Supabase SQL Editor; deploying application code does not apply SQL migrations.
-- Existing sector translations are preserved. Missing locale rows are created atomically.
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

  -- Initialize only missing translations, preserving all existing content.
  insert into public.content_translations(entity_type,entity_id,locale,title,summary,body)
  select 'sector',v_sector_id,lang.locale,
         case when lang.locale='ar' then 'المقاولات والتطوير العقاري' else 'Contracting & Real Estate Development' end,
         '', '{}'::jsonb
  from (values ('ar'),('en')) as lang(locale)
  on conflict (entity_type,entity_id,locale) do nothing;

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
  -- Activate the sector only after the content and media publication succeeded.
  update public.sectors set status='published' where id=v_sector_id;
  update public.contracting_content_drafts set content=v_content where locale=p_locale;
end;
$function$;


revoke all on function public.publish_contracting_draft(text) from public, anon, authenticated;
revoke all on function public.publish_contracting_editor_draft(text) from public, anon;
grant execute on function public.publish_contracting_editor_draft(text) to authenticated;
