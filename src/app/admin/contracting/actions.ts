'use server';
import {revalidatePath} from 'next/cache';
import {serverDb} from '@/lib/supabase/server';
import {contractingEditableTextKeys} from '@/config/contracting.architecture';

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
 for(const key of contractingEditableTextKeys){
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
