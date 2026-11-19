'use server';
import {revalidatePath} from 'next/cache';
import {serverDb} from '@/lib/supabase/server';

const entityTypes = {
 sectors:'sector', services:'service', projects:'project', news:'news',
 pages:'page', catalog_categories:'category', catalog_products:'product'
} as const;
type EntityTable=keyof typeof entityTypes;
const statuses=['draft','review','published','archived'];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const protectedSlugs=new Set(['home','homepage','index','landing','main']);
const string=(f:FormData,k:string,max=3000)=>{const v=f.get(k);if(typeof v!=='string')throw new Error('Missing '+k);if(v.length>max)throw new Error('Field too long: '+k);return v.trim();};

export async function updateManagedEntry(form:FormData) {
 const db=await serverDb();
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)throw new Error('Authentication required');
 const {data:member,error:memberError}=await db.from('admin_memberships').select('role').eq('user_id',user.id).eq('active',true).maybeSingle();
 if(memberError||member?.role!=='owner')throw new Error('Owner permission required');
 const table=string(form,'table',40) as EntityTable;
 if(!Object.prototype.hasOwnProperty.call(entityTypes,table))throw new Error('Invalid entity');
 const id=string(form,'id',40);
 if(!uuid.test(id))throw new Error('Invalid id');
 const {data:existing,error:readError}=await db.from(table).select('id,slug,status').eq('id',id).maybeSingle();
 if(readError||!existing)throw new Error('Entry not found');
 if(table==='pages'&&protectedSlugs.has(existing.slug))throw new Error('The group home page is protected');
 const status=string(form,'status',20);
 if(!statuses.includes(status))throw new Error('Invalid status');
 const slug=string(form,'slug',80);
 if(!/^[a-z0-9-]{2,80}$/.test(slug))throw new Error('Invalid slug');
 if(table==='pages'&&protectedSlugs.has(slug))throw new Error('The group home page is protected');
 const sectorId=string(form,'sector_id',40);
 const requiresSector=['services','projects','catalog_categories','catalog_products'].includes(table);
 if(requiresSector&&!uuid.test(sectorId))throw new Error('Sector required');
 if(sectorId&&!uuid.test(sectorId))throw new Error('Invalid sector');
 if(sectorId&&table!=='sectors'){
  const {data:sector,error}=await db.from('sectors').select('id').eq('id',sectorId).maybeSingle();
  if(error||!sector)throw new Error('Sector not found');
 }
 const changes:Record<string,unknown>={status,slug};
 if(table!=='sectors')changes.sector_id=sectorId||null;
 if(table==='sectors'){
  const order=Number(string(form,'sort_order',12));
  if(!Number.isSafeInteger(order)||order<0||order>9999)throw new Error('Invalid order');
  changes.sort_order=order;
 }
 if(table==='services'){
  const order=Number(string(form,'sort_order',12));
  if(!Number.isSafeInteger(order)||order<0||order>9999)throw new Error('Invalid order');
  changes.sort_order=order;
 }
 if(table==='catalog_products'){
  const categoryId=string(form,'category_id',40);
  if(categoryId&&!uuid.test(categoryId))throw new Error('Invalid category');
  if(categoryId){
   const {data:category,error}=await db.from('catalog_categories').select('id,sector_id').eq('id',categoryId).maybeSingle();
   if(error||!category||category.sector_id!==sectorId)throw new Error('Category must belong to the selected sector');
  }
  changes.category_id=categoryId||null;
 }
 const translations=(['ar','en'] as const).map(locale=>({
  locale,title:string(form,'title_'+locale,250),summary:string(form,'summary_'+locale,3000)
 }));
 if(translations.some(t=>!t.title))throw new Error('Both titles are required');
 const {data:existingTranslations,error:trError}=await db.from('content_translations').select('id,locale').eq('entity_type',entityTypes[table]).eq('entity_id',id).in('locale',['ar','en']);
 if(trError)throw new Error(trError.message);
 // Update only existing translation rows; never replace their body JSON or media relationships.
 // Prevalidate all rows before making writes, so missing translations cannot leave partial updates.
 if(translations.some(t=>!existingTranslations?.some(x=>x.locale===t.locale)))throw new Error('Missing translation row; no changes made');
 const {error:updateError}=await db.from(table).update(changes).eq('id',id);
 if(updateError)throw new Error(updateError.message);
 for(const t of translations){
  const tr=existingTranslations!.find(x=>x.locale===t.locale)!;
  const {error}=await db.from('content_translations').update({title:t.title,summary:t.summary}).eq('id',tr.id);
  if(error)throw new Error('Translation update failed ('+t.locale+'): '+error.message);
 }
 revalidatePath('/admin');
 revalidatePath('/admin/'+table);
 revalidatePath('/ar',{type:'layout'});
 revalidatePath('/en',{type:'layout'});
}
