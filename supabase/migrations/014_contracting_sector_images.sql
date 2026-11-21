-- Six independent sector images. Apply only after migration 013.
-- Keep all existing media references, drafts and published content.
alter function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb)
 rename to save_contracting_editor_draft_v4;
alter function public.publish_contracting_editor_draft(text)
 rename to publish_contracting_editor_draft_v4;

revoke all on function public.save_contracting_editor_draft_v4(text,jsonb,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.publish_contracting_editor_draft_v4(text) from public,anon,authenticated;

create function public.save_contracting_editor_draft(
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
 if jsonb_typeof(p_content->'domainMediaIds') <> 'array'
    or jsonb_array_length(p_content->'domainMediaIds') <> 6 then
  raise exception 'Exactly six sector media entries required';
 end if;
 perform public.validate_contracting_service_media(
  jsonb_build_object('serviceMediaIds',p_content->'domainMediaIds'),v_sector
 );
 perform public.save_contracting_editor_draft_v4(
  p_locale,p_content-'domainMediaIds',p_media_id,p_project_media
 );
 update public.contracting_content_drafts set content=p_content where locale=p_locale;
 if not found then raise exception 'Contracting draft not found after save'; end if;
end;
$fn$;

create function public.publish_contracting_editor_draft(p_locale text)
returns void language plpgsql security definer set search_path=public,pg_temp
as $fn$
declare v_sector uuid;v_content jsonb;v_domain jsonb;
begin
 if auth.uid() is null or not public.is_owner() then
  raise exception 'Owner permission required' using errcode='42501';
 end if;
 select id into v_sector from public.sectors where slug='contracting' for update;
 if not found then raise exception 'Contracting sector not found'; end if;
 select content into v_content from public.contracting_content_drafts
 where locale=p_locale for update;
 if not found then raise exception 'Save a draft before publishing'; end if;
 v_domain:=v_content->'domainMediaIds';
 if jsonb_typeof(v_domain) <> 'array' or jsonb_array_length(v_domain) <> 6 then
  raise exception 'Exactly six sector media entries required';
 end if;
 perform public.validate_contracting_service_media(
  jsonb_build_object('serviceMediaIds',v_domain),v_sector
 );
 update public.contracting_content_drafts
 set content=v_content-'domainMediaIds' where locale=p_locale;
 perform public.publish_contracting_editor_draft_v4(p_locale);
 update public.content_translations
 set body=jsonb_set(
  case when jsonb_typeof(body)='object' then body else '{}'::jsonb end,
  '{contracting,domainMediaIds}',v_domain,true)
 where entity_type='sector' and entity_id=v_sector and locale=p_locale;
 if not found then raise exception 'Contracting translation not found'; end if;
 update public.contracting_content_drafts set content=v_content where locale=p_locale;
end;
$fn$;

revoke all on function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb) from public,anon;
revoke all on function public.publish_contracting_editor_draft(text) from public,anon;
grant execute on function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb) to authenticated;
grant execute on function public.publish_contracting_editor_draft(text) to authenticated;
