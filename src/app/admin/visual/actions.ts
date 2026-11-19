'use server';
import {serverDb} from '@/lib/supabase/server';
import {revalidatePath} from 'next/cache';
export async function assignMediaSlot(input:{entityType:'project'|'service'|'sector';entityId:string;mediaId:string;slot:number}){
 const db=await serverDb();
 const {data:{user}}=await db.auth.getUser();
 if(!user)throw new Error('يرجى تسجيل الدخول');
 const {data:member}=await db.from('admin_memberships').select('role').eq('user_id',user.id).eq('active',true).maybeSingle();
 if(member?.role!=='owner')throw new Error('هذه العملية تتطلب صلاحية المالك');
 if(!['project','service','sector'].includes(input.entityType)||!Number.isInteger(input.slot)||input.slot<0||input.slot>9||![input.entityId,input.mediaId].every(x=>/^[0-9a-f-]{36}$/i.test(x)))throw new Error('بيانات غير صالحة');
 const table=input.entityType==='project'?'projects':input.entityType==='service'?'services':'sectors';
 const [{data:entity},{data:media}]=await Promise.all([db.from(table).select('id,sector_id').eq('id',input.entityId).maybeSingle().then(x=>input.entityType==='sector'?db.from('sectors').select('id').eq('id',input.entityId).maybeSingle():x),db.from('media_assets').select('id,sector_id').eq('id',input.mediaId).maybeSingle()]);
 if(!entity||!media)throw new Error('العنصر أو الصورة غير موجود');
 const sectorId=input.entityType==='sector'?input.entityId:(entity as {sector_id?:string}).sector_id;
 if(media.sector_id&&sectorId&&media.sector_id!==sectorId)throw new Error('الصورة مخصصة لقطاع آخر');
 const {data:existing,error:readError}=await db.from('entity_media').select('media_id').eq('entity_type',input.entityType).eq('entity_id',input.entityId).eq('sort_order',input.slot).maybeSingle();
 if(readError)throw new Error(readError.message);
 if(existing){
  const {error}=await db.from('entity_media').update({media_id:input.mediaId}).eq('entity_type',input.entityType).eq('entity_id',input.entityId).eq('sort_order',input.slot);
  if(error)throw new Error(error.message);
 }else{
  const {error}=await db.from('entity_media').insert({entity_type:input.entityType,entity_id:input.entityId,media_id:input.mediaId,sort_order:input.slot});
  if(error)throw new Error(error.message);
 }
 revalidatePath('/admin/visual');revalidatePath('/admin/media');revalidatePath('/ar');revalidatePath('/en');
}
