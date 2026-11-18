'use server';
import {serverDb} from '@/lib/supabase/server';
import {revalidatePath} from 'next/cache';
import {randomUUID} from 'crypto';

export async function uploadMedia(form:FormData){
 const db=await serverDb();const{data:{user}}=await db.auth.getUser();if(!user)throw new Error('Unauthorized');
 const{data:member}=await db.from('admin_memberships').select('role').eq('user_id',user.id).eq('active',true).maybeSingle();
 if(member?.role!=='owner')throw new Error('Owner required');
 const file=form.get('file');if(!(file instanceof File)||file.size<1||file.size>10*1024*1024)throw new Error('Invalid file size');
 if(file.type!=='image/webp')throw new Error('Images must be converted to WebP before upload');
 const sectorId=String(form.get('sector_id')||'');
 if(sectorId&&!/^[0-9a-f-]{36}$/i.test(sectorId))throw new Error('Invalid sector');
 const entityType=String(form.get('entity_type')||'project'),entityId=String(form.get('entity_id')||'');
 if(entityId&&(!['project','service'].includes(entityType)||!/^[0-9a-f-]{36}$/i.test(entityId)))throw new Error('Invalid entity');
 if(entityId){
  const table=entityType==='project'?'projects':'services';
  const{data:entity,error:entityError}=await db.from(table).select('id,sector_id').eq('id',entityId).single();
  if(entityError||!entity)throw new Error('Linked content not found');
  if(sectorId&&entity.sector_id!==sectorId)throw new Error('The image sector must match the linked content sector');
 }
 const ratio=String(form.get('display_ratio')||'16/9'),fit=String(form.get('display_fit')||'cover'),position=String(form.get('display_position')||'center');
 if(!['16/9','4/3','1/1','3/4','21/9'].includes(ratio)||!['cover','contain'].includes(fit)||!['center','top','bottom','left','right'].includes(position))throw new Error('Invalid presentation settings');
 const width=Number(form.get('width')),height=Number(form.get('height'));
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>20000||height>20000)throw new Error('Invalid dimensions');
 const altAr=String(form.get('alt_ar')||'').trim(),altEn=String(form.get('alt_en')||'').trim();
 if(!altAr||!altEn||altAr.length>300||altEn.length>300)throw new Error('Alternative text required in both languages');
 const path='uploads/'+randomUUID()+'.webp';
 const{error:storageError}=await db.storage.from('blom-media').upload(path,file,{contentType:'image/webp',upsert:false});
 if(storageError)throw new Error(storageError.message);
 const{data:url}=db.storage.from('blom-media').getPublicUrl(path);
 const{data:asset,error:insertError}=await db.from('media_assets').insert({storage_path:path,public_url:url.publicUrl,alt_ar:altAr,alt_en:altEn,sector_id:sectorId||null,width_px:width,height_px:height,display_ratio:ratio,display_fit:fit,display_position:position}).select('id').single();
 if(insertError||!asset){await db.storage.from('blom-media').remove([path]);throw new Error(insertError?.message||'Media save failed')}
 if(entityId){
  const{data:last}=await db.from('entity_media').select('sort_order').eq('entity_type',entityType).eq('entity_id',entityId).order('sort_order',{ascending:false}).limit(1).maybeSingle();
  const{error:linkError}=await db.from('entity_media').insert({entity_type:entityType,entity_id:entityId,media_id:asset.id,sort_order:(last?.sort_order??-1)+1});
  if(linkError){await db.from('media_assets').delete().eq('id',asset.id);await db.storage.from('blom-media').remove([path]);throw new Error(linkError.message)}
 }
 revalidatePath('/admin/media');revalidatePath('/admin/projects');revalidatePath('/ar');revalidatePath('/en');
}
