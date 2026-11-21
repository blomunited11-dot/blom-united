-- 013: Six independent quality/safety images, compatible with migration 012.
-- Apply after 011 and 012. Preserve existing hero, service and portfolio image links.
alter function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb)
 rename to save_contracting_editor_draft_v3;
alter function public.publish_contracting_editor_draft(text)
 rename to publish_contracting_editor_draft_v3;

revoke all on function public.save_contracting_editor_draft_v3(text,jsonb,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.publish_contracting_editor_draft_v3(text) from public,anon,authenticated;

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
 perform public.validate_contracting_service_media(
  jsonb_build_object('serviceMediaIds',p_content->'qualityMediaIds'),v_sector
 );
 perform public.save_contracting_editor_draft_v3(
  p_locale,p_content-'qualityMediaIds',p_media_id,p_project_media
 );
 update public.contracting_content_drafts set content=p_content where locale=p_locale;
 if not found then raise exception 'Contracting draft not found after save'; end if;
end;
$fn$;

create or replace function public.publish_contracting_editor_draft(p_locale text)
returns void language plpgsql security definer set search_path=public,pg_temp
as $fn$
declare v_sector uuid;v_content jsonb;v_quality jsonb;v_body jsonb;
begin
 if auth.uid() is null or not public.is_owner() then
  raise exception 'Owner permission required' using errcode='42501';
 end if;
 select id into v_sector from public.sectors where slug='contracting' for update;
 if not found then raise exception 'Contracting sector not found'; end if;
 select content into v_content from public.contracting_content_drafts
 where locale=p_locale for update;
 if not found then raise exception 'Save a draft before publishing'; end if;
 v_quality:=v_content->'qualityMediaIds';
 perform public.validate_contracting_service_media(
  jsonb_build_object('serviceMediaIds',v_quality),v_sector
 );
 update public.contracting_content_drafts
 set content=v_content-'qualityMediaIds' where locale=p_locale;
 perform public.publish_contracting_editor_draft_v3(p_locale);
 update public.content_translations
 set body=jsonb_set(
  case when jsonb_typeof(body)='object' then body else '{}'::jsonb end,
  '{contracting,qualityMediaIds}',v_quality,true)
 where entity_type='sector' and entity_id=v_sector and locale=p_locale;
 if not found then raise exception 'Contracting translation not found'; end if;
 update public.contracting_content_drafts set content=v_content where locale=p_locale;
end;
$fn$;

revoke all on function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb) from public,anon;
revoke all on function public.publish_contracting_editor_draft(text) from public,anon;
grant execute on function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb) to authenticated;
grant execute on function public.publish_contracting_editor_draft(text) to authenticated;
