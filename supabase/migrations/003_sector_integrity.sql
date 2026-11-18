-- Enforce the four approved sector slugs; data is inserted as draft for approval.
insert into public.sectors(slug,sort_order,status) values
('contracting',1,'draft'),('industry',2,'draft'),('hospitality',3,'draft'),('business-services',4,'draft')
on conflict(slug) do nothing;
-- Ownership consistency across catalog categories and products.
create or replace function public.check_catalog_sector() returns trigger language plpgsql as $$
begin
 if new.category_id is not null and not exists(select 1 from public.catalog_categories c where c.id=new.category_id and c.sector_id=new.sector_id) then
 raise exception 'Product category belongs to another sector';
 end if;
 return new;
end$$;
create trigger catalog_sector_consistency before insert or update on public.catalog_products for each row execute function public.check_catalog_sector();
