-- 015: Accept the optional lifecycle infographic media slot without changing legacy validators.
-- Requires 014. Safe for existing drafts; preserves all content and media associations.
alter function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb)
 rename to save_contracting_editor_draft_v5;
alter function public.publish_contracting_editor_draft(text)
 rename to publish_contracting_editor_draft_v5;
revoke all on function public.save_contracting_editor_draft_v5(text,jsonb,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.publish_contracting_editor_draft_v5(text) from public,anon,authenticated;

create function public.save_contracting_editor_draft(
 p_locale text,p_content jsonb,p_media_id uuid,p_project_media jsonb
) returns void language plpgsql security definer set search_path=public,pg_temp
as $fn$
declare v_sector uuid;v_media uuid;v_url text;v_media_sector uuid;
begin
 if auth.uid() is null or not public.is_owner() then
  raise exception 'Owner permission required' using errcode='42501';
 end if;
 if jsonb_typeof(p_content) is distinct from 'object'
  or not (p_content ? 'lifecycleMediaId')
  or (p_content->'lifecycleMediaId' <> 'null'::jsonb
      and (jsonb_typeof(p_content->'lifecycleMediaId') is distinct from 'string'
       or (p_content->>'lifecycleMediaId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')) then
  raise exception 'Invalid lifecycle banner media';
 end if;
 select id into v_sector from public.sectors where slug='contracting' for update;
 if not found then raise exception 'Contracting sector not found'; end if;
 if p_content->'lifecycleMediaId'<>'null'::jsonb then
  v_media:=(p_content->>'lifecycleMediaId')::uuid;
  select sector_id,public_url into v_media_sector,v_url from public.media_assets where id=v_media;
  if not found or v_url is null or (v_media_sector is not null and v_media_sector<>v_sector) then
   raise exception 'Lifecycle banner media not available for this sector';
  end if;
 end if;
 perform public.save_contracting_editor_draft_v5(
  p_locale,p_content-'lifecycleMediaId',p_media_id,p_project_media
 );
 update public.contracting_content_drafts set content=p_content where locale=p_locale;
 if not found then raise exception 'Contracting draft not found after save'; end if;
end;
$fn$;

create function public.publish_contracting_editor_draft(p_locale text)
returns void language plpgsql security definer set search_path=public,pg_temp
as $fn$
declare v_sector uuid;v_content jsonb;v_lifecycle jsonb;
begin
 if auth.uid() is null or not public.is_owner() then
  raise exception 'Owner permission required' using errcode='42501';
 end if;
 select id into v_sector from public.sectors where slug='contracting' for update;
 if not found then raise exception 'Contracting sector not found'; end if;
 select content into v_content from public.contracting_content_drafts where locale=p_locale for update;
 if not found then raise exception 'Save a draft before publishing'; end if;
 v_lifecycle:=coalesce(v_content->'lifecycleMediaId','null'::jsonb);
 update public.contracting_content_drafts set content=v_content-'lifecycleMediaId' where locale=p_locale;
 perform public.publish_contracting_editor_draft_v5(p_locale);
 update public.content_translations
 set body=jsonb_set(
  case when jsonb_typeof(body)='object' then body else '{}'::jsonb end,
  '{contracting,lifecycleMediaId}',v_lifecycle,true)
 where entity_type='sector' and entity_id=v_sector and locale=p_locale;
 if not found then raise exception 'Contracting translation not found'; end if;
 update public.contracting_content_drafts set content=v_content where locale=p_locale;
end;
$fn$;
revoke all on function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb) from public,anon;
revoke all on function public.publish_contracting_editor_draft(text) from public,anon;
grant execute on function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb) to authenticated;
grant execute on function public.publish_contracting_editor_draft(text) to authenticated;
