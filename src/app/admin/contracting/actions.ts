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
 const section=String(form.get('section')||'');
 const selected=contractingArchitecture.find(x=>x.id===section);
 if(!selected)throw new Error('Invalid section');
 const keys=selected.fields.filter(x=>x.kind==='text'&&x.editable).map(x=>x.key);
 if(keys.some(key=>!contractingEditableTextKeys.includes(key)))throw new Error('Invalid fields');
 const values:Record<string,string>={};
 for(const key of keys){
  const value=form.get(key);
  if(typeof value!=='string')throw new Error('Missing field: '+key);
  const clean=value.trim();
  if(clean.length>3000)throw new Error('Text exceeds 3000 characters: '+key);
  values[key]=clean;
 }
 const {error}=await db.rpc('save_contracting_copy',{p_locale:locale,p_values:values});
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
 const {error}=await db.rpc('save_contracting_hero_media',{p_media_id:mediaId||null});
 if(error)throw new Error(error.message);
 revalidatePath('/admin/contracting');
 revalidatePath('/admin/visual');
 revalidatePath('/ar/sectors/contracting');
 revalidatePath('/en/sectors/contracting');
 revalidatePath('/ar/sectors');
 revalidatePath('/en/sectors');
}
