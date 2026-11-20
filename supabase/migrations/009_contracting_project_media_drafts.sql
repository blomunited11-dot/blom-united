create table if not exists public.contracting_project_media_drafts (
  project_id uuid primary key references public.projects(id) on delete cascade,
  media_id uuid not null references public.media_assets(id) on delete cascade,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.contracting_project_media_drafts enable row level security;
drop policy if exists contracting_project_media_drafts_owner_read
  on public.contracting_project_media_drafts;
create policy contracting_project_media_drafts_owner_read
  on public.contracting_project_media_drafts for select
  using (public.is_owner());
revoke all on public.contracting_project_media_drafts from anon, authenticated;
grant select on public.contracting_project_media_drafts to authenticated;

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
  v_project_id uuid;
  v_project_sector_id uuid;
  v_media_id uuid;
  v_media_sector_id uuid;
  v_public_url text;
  v_item jsonb;
  v_action text;
  v_seen uuid[] := '{}';
begin
  if auth.uid() is null or not public.is_owner() then
    raise exception 'Owner permission required' using errcode = '42501';
  end if;

  select id into v_sector_id from public.sectors where slug='contracting' for update;
  if not found then raise exception 'Contracting sector not found'; end if;

  if p_project_media is null or jsonb_typeof(p_project_media) is distinct from 'array' then
    raise exception 'Invalid project media selections';
  end if;
  if jsonb_array_length(p_project_media)>100 then
    raise exception 'Too many project media selections';
  end if;

  perform public.save_contracting_draft(p_locale,p_content,p_media_id);

  for v_item in select value from jsonb_array_elements(p_project_media)
  loop
    if jsonb_typeof(v_item) is distinct from 'object' then
      raise exception 'Invalid project media selection';
    end if;
    if jsonb_object_length(v_item)<>3 or exists (
      select 1 from jsonb_object_keys(v_item) as item(key)
      where item.key not in ('project_id','action','media_id')
    ) then
      raise exception 'Invalid project media selection';
    end if;
    if jsonb_typeof(v_item->'project_id') is distinct from 'string'
      or (v_item->>'project_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or jsonb_typeof(v_item->'action') is distinct from 'string' then
      raise exception 'Invalid project media selection';
    end if;

    v_project_id:=(v_item->>'project_id')::uuid;
    v_action:=v_item->>'action';
    if v_project_id=any(v_seen) then
      raise exception 'Duplicate project media selection';
    end if;
    v_seen:=array_append(v_seen,v_project_id);

    select sector_id into v_project_sector_id
    from public.projects where id=v_project_id for update;
    if not found or v_project_sector_id<>v_sector_id then
      raise exception 'Project is not part of the contracting sector';
    end if;

    if v_action='set' then
      if jsonb_typeof(v_item->'media_id') is distinct from 'string'
        or (v_item->>'media_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        raise exception 'Invalid project media selection';
      end if;
      v_media_id:=(v_item->>'media_id')::uuid;
      select sector_id,public_url into v_media_sector_id,v_public_url
      from public.media_assets where id=v_media_id;
      if not found or v_public_url is null
        or (v_media_sector_id is not null and v_media_sector_id<>v_sector_id) then
        raise exception 'Media not available for this project';
      end if;

      insert into public.contracting_project_media_drafts(project_id,media_id,updated_by,updated_at)
      values(v_project_id,v_media_id,auth.uid(),now())
      on conflict(project_id) do update set
        media_id=excluded.media_id,
        updated_by=excluded.updated_by,
        updated_at=excluded.updated_at;
    elsif v_action='discard' then
      if v_item->'media_id' is distinct from 'null'::jsonb then
        raise exception 'Invalid project media selection';
      end if;
      delete from public.contracting_project_media_drafts where project_id=v_project_id;
    else
      raise exception 'Invalid project media action';
    end if;
  end loop;
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
  v_project_draft record;
  v_media_sector_id uuid;
  v_public_url text;
begin
  if auth.uid() is null or not public.is_owner() then
    raise exception 'Owner permission required' using errcode = '42501';
  end if;

  perform public.publish_contracting_draft(p_locale);

  select id into v_sector_id from public.sectors where slug='contracting' for update;
  if not found then raise exception 'Contracting sector not found'; end if;

  for v_project_draft in
    select d.project_id,d.media_id
    from public.contracting_project_media_drafts d
    join public.projects p on p.id=d.project_id
    where p.sector_id=v_sector_id
    order by d.project_id
    for update of d
  loop
    select sector_id,public_url into v_media_sector_id,v_public_url
    from public.media_assets where id=v_project_draft.media_id;
    if not found or v_public_url is null
      or (v_media_sector_id is not null and v_media_sector_id<>v_sector_id) then
      raise exception 'Media not available for this project';
    end if;

    delete from public.entity_media
    where entity_type='project'
      and entity_id=v_project_draft.project_id
      and sort_order=0;
    insert into public.entity_media(entity_type,entity_id,media_id,sort_order)
    values('project',v_project_draft.project_id,v_project_draft.media_id,0);
    delete from public.contracting_project_media_drafts
    where project_id=v_project_draft.project_id;
  end loop;
end;
$function$;

revoke all on function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb) from public;
revoke all on function public.publish_contracting_editor_draft(text) from public;
grant execute on function public.save_contracting_editor_draft(text,jsonb,uuid,jsonb) to authenticated;
grant execute on function public.publish_contracting_editor_draft(text) to authenticated;
