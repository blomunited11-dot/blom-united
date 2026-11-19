'use server';
import {revalidatePath} from 'next/cache';
import {serverDb} from '@/lib/supabase/server';
import {contractingArchitecture,contractingEditableTextKeys} from '@/config/contracting.architecture';

export async function saveContractingCopy(form:FormData) {
 const locale=String(form.get('locale')||'');
 if(locale!=='ar'&&locale!=='en')throw new Error('Invalid locale');
 const db=await serverDb();
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)throw new Error('Authentication required');
 const {data:member,error:membershipError}=await db.from('admin_memberships').select('role').eq('user_id',user.id).eq('active',true).maybeSingle();
 if(membershipError||member?.role!=='owner')throw new Error('Owner permission required');
 const {data:sector,error:sectorError}=await db.from('sectors').select('id').eq('slug','contracting').maybeSingle();
 if(sectorError||!sector)throw new Error('Contracting sector not found; no content was changed');
 const {data:row,error:rowError}=await db.from('content_translations').select('id,body').eq('entity_type','sector').eq('entity_id',sector.id).eq('locale',locale).maybeSingle();
 if(rowError||!row)throw new Error('Contracting translation missing; no content was changed');
 const body:Record<string,unknown>=row.body&&typeof row.body==='object'&&!Array.isArray(row.body)?{...row.body as Record<string,unknown>}:{};
 const prior=body.contracting;
 const copy:Record<string,unknown>=prior&&typeof prior==='object'&&!Array.isArray(prior)?{...prior as Record<string,unknown>}:{};
 const section=String(form.get('section')||'');
 const selected=contractingArchitecture.find(x=>x.id===section);
 if(!selected)throw new Error('Invalid section');
 const keys=selected.fields.filter(x=>x.kind==='text'&&x.editable).map(x=>x.key);
 if(keys.some(key=>!contractingEditableTextKeys.includes(key)))throw new Error('Invalid fields');
 for(const key of keys){
  const value=form.get(key);
  if(typeof value!=='string')throw new Error('Missing field: '+key);
  const clean=value.trim();
  if(clean.length>3000)throw new Error('Text exceeds 3000 characters: '+key);
  if(clean)copy[key]=clean;else delete copy[key];
 }
 body.contracting=copy;
 const {error}=await db.from('content_translations').update({body}).eq('id',row.id);
 if(error)throw new Error(error.message);
 revalidatePath('/admin/contracting');
 revalidatePath('/ar/sectors/contracting');
 revalidatePath('/en/sectors/contracting');
}

/** Select an existing media library image for the contracting hero; no arbitrary URLs. */
export async function saveContractingHeroImage(form:FormData){
 const db=await serverDb();
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)throw new Error('Authentication required');
 const {data:member,error:memberError}=await db.from('admin_memberships').select('role').eq('user_id',user.id).eq('active',true).maybeSingle();
 if(memberError||member?.role!=='owner')throw new Error('Owner permission required');
 const mediaId=String(form.get('media_id')||'');
 if(mediaId&&!/^[0-9a-f-]{36}$/i.test(mediaId))throw new Error('Invalid media');
 const {data:sector,error:sectorError}=await db.from('sectors').select('id').eq('slug','contracting').maybeSingle();
 if(sectorError||!sector)throw new Error('Contracting sector not found');
 if(mediaId){
  const {data:media,error}=await db.from('media_assets').select('id,public_url,sector_id').eq('id',mediaId).maybeSingle();
  if(error||!media?.public_url||(media.sector_id&&media.sector_id!==sector.id))throw new Error('Media not available for this sector');
 }
 const {data:rows,error:readError}=await db.from('content_translations').select('id,body').eq('entity_type','sector').eq('entity_id',sector.id).in('locale',['ar','en']);
 if(readError||!rows||rows.length!==2)throw new Error('Both translations required');
 for(const row of rows){
  const body:Record<string,unknown>=row.body&&typeof row.body==='object'&&!Array.isArray(row.body)?{...row.body as Record<string,unknown>}:{};
  const raw=body.contracting;
  const copy:Record<string,unknown>=raw&&typeof raw==='object'&&!Array.isArray(raw)?{...raw as Record<string,unknown>}:{};
  if(mediaId)copy.heroMediaId=mediaId;else delete copy.heroMediaId;
  body.contracting=copy;
  const {error}=await db.from('content_translations').update({body}).eq('id',row.id);
  if(error)throw new Error(error.message);
 }
 revalidatePath('/admin/contracting');
 revalidatePath('/ar/sectors/contracting');
 revalidatePath('/en/sectors/contracting');
}
