-- 012: Six independent capability images, retained in the existing contracting draft and published JSON.
-- Requires migration 011 first. No new tables or public write permissions.
alter function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb)
  rename to save_contracting_editor_draft_v2;
alter function public.publish_contracting_editor_draft(text)
  rename to publish_contracting_editor_draft_v2;

revoke all on function public.save_contracting_editor_draft_v2(text,jsonb,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.publish_contracting_editor_draft_v2(text) from public,anon,authenticated;

create or replace function public.validate_contracting_service_media(p_content jsonb,p_sector_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp
as $fn$
declare v_ids jsonb; v_item jsonb; v_sector uuid; v_url text;
begin
 v_ids:=p_content->'serviceMediaIds';
 if jsonb_typeof(v_ids) is distinct from 'array' or jsonb_array_length(v_ids)<>6 then
  raise exception 'Exactly six capability image slots are required';
 end if;
 for v_item in select value from jsonb_array_elements(v_ids) loop
  if v_item='null'::jsonb then continue; end if;
  if jsonb_typeof(v_item) is distinct from 'string'
    or (v_item#>>'{}') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
   raise exception 'Invalid capability image ID';
  end if;
  select sector_id,public_url into v_sector,v_url from public.media_assets
  where id=(v_item#>>'{}')::uuid;
  if not found or v_url is null or (v_sector is not null and v_sector<>p_sector_id) then
   raise exception 'Capability image not available for contracting';
  end if;
 end loop;
end;
$fn$;
revoke all on function public.validate_contracting_service_media(jsonb,uuid) from public,anon,authenticated;

create or replace function public.save_contracting_editor_draft(
 p_locale text,p_content jsonb,p_media_id uuid,p_project_media jsonb
) returns void language plpgsql security definer set search_path=public,pg_temp
as $fn$
declare v_sector uuid;
begin
 if auth.uid() is null or not public.is_owner() then
  raise exception 'Owner permission required' using errcode='42501';
 end if;
 select id into v_sector from public.sectors where slug='contracting' for update;
 if not found then raise exception 'Contracting sector not found'; end if;
 perform public.validate_contracting_service_media(p_content,v_sector);
 perform public.save_contracting_editor_draft_v2(
  p_locale,p_content-'serviceMediaIds',p_media_id,p_project_media
 );
 update public.contracting_content_drafts
 set content=p_content where locale=p_locale;
 if not found then raise exception 'Contracting draft not found after save'; end if;
end;
$fn$;

create or replace function public.publish_contracting_editor_draft(p_locale text)
returns void language plpgsql security definer set search_path=public,pg_temp
as $fn$
declare v_sector uuid; v_content jsonb; v_ids jsonb; v_body jsonb;
begin
 if auth.uid() is null or not public.is_owner() then
  raise exception 'Owner permission required' using errcode='42501';
 end if;
 select id into v_sector from public.sectors where slug='contracting' for update;
 if not found then raise exception 'Contracting sector not found'; end if;
 select content into v_content from public.contracting_content_drafts
 where locale=p_locale for update;
 if not found then raise exception 'Save a draft before publishing'; end if;
 perform public.validate_contracting_service_media(v_content,v_sector);
 v_ids:=v_content->'serviceMediaIds';
 update public.contracting_content_drafts
 set content=v_content-'serviceMediaIds' where locale=p_locale;
 perform public.publish_contracting_editor_draft_v2(p_locale);
 update public.content_translations
 set body=jsonb_set(
  case when jsonb_typeof(body)='object' then body else '{}'::jsonb end,
  '{contracting,serviceMediaIds}',v_ids,true)
 where entity_type='sector' and entity_id=v_sector and locale=p_locale;
 if not found then raise exception 'Contracting translation not found'; end if;
 update public.contracting_content_drafts set content=v_content where locale=p_locale;
end;
$fn$;
revoke all on function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb) from public,anon;
revoke all on function public.publish_contracting_editor_draft(text) from public,anon;
grant execute on function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb) to authenticated;
grant execute on function public.publish_contracting_editor_draft(text) to authenticated;
