'use server';
import {randomUUID} from 'crypto';
import {serverDb} from '@/lib/supabase/server';

export async function uploadContractingEditorImage(form:FormData){
 const db=await serverDb();
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)throw new Error('Authentication required');
 const {data:member,error:memberError}=await db.from('admin_memberships').select('role').eq('user_id',user.id).eq('active',true).maybeSingle();
 if(memberError||member?.role!=='owner')throw new Error('Owner permission required');
 const file=form.get('file');
 if(!(file instanceof File)||file.size<1||file.size>10*1024*1024||file.type!=='image/webp')throw new Error('Upload a WebP image under 10 MB');
 const altAr=String(form.get('alt_ar')||'').trim();
 const altEn=String(form.get('alt_en')||'').trim();
 if(!altAr||!altEn||altAr.length>300||altEn.length>300)throw new Error('Image description required in both languages');
 const {data:sector,error:sectorError}=await db.from('sectors').select('id').eq('slug','contracting').single();
 if(sectorError||!sector)throw new Error('Contracting sector not found');
 const path='uploads/'+randomUUID()+'.webp';
 const {error:uploadError}=await db.storage.from('blom-media').upload(path,file,{contentType:'image/webp',upsert:false});
 if(uploadError)throw new Error(uploadError.message);
 const {data:url}=db.storage.from('blom-media').getPublicUrl(path);
 const {data:asset,error:insertError}=await db.from('media_assets').insert({storage_path:path,public_url:url.publicUrl,alt_ar:altAr,alt_en:altEn,sector_id:sector.id}).select('id,public_url,alt_ar,alt_en').single();
 if(insertError||!asset){await db.storage.from('blom-media').remove([path]);throw new Error(insertError?.message||'Image record failed')}
 return asset;
}
