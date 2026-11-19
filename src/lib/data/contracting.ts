import type {Locale} from '@/lib/i18n/dictionary';
import {serverDb} from '@/lib/supabase/server';
import {contractingEditableTextKeys} from '@/config/contracting.architecture';

export type ContractingCopy = Record<string,string>;
const allowed = new Set(contractingEditableTextKeys);

/** Keep other body JSON keys intact; only this namespaced object belongs to the contracting editor. */
export function readContractingCopy(body:unknown): ContractingCopy {
 if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
 const raw=(body as Record<string,unknown>).contracting;
 if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
 return Object.fromEntries(Object.entries(raw).filter(([key,value])=>allowed.has(key)&&typeof value==='string'&&value.trim().length>0)) as ContractingCopy;
}
export async function getContractingCopy(locale:Locale):Promise<ContractingCopy> {
 try {
  const db=await serverDb();
  const {data:sector,error}=await db.from('sectors').select('id').eq('slug','contracting').eq('status','published').maybeSingle();
  if(error||!sector)return {};
  const {data:translation,error:translationError}=await db.from('content_translations').select('body').eq('entity_type','sector').eq('entity_id',sector.id).eq('locale',locale).maybeSingle();
  if(translationError)return {};
  return readContractingCopy(translation?.body);
 } catch {return {}}
}

export async function getContractingHeroImage(locale:Locale):Promise<string|null>{
 try{
  const db=await serverDb();
  const {data:sector}=await db.from('sectors').select('id').eq('slug','contracting').eq('status','published').maybeSingle();
  if(!sector)return null;
  const {data:row}=await db.from('content_translations').select('body').eq('entity_type','sector').eq('entity_id',sector.id).eq('locale',locale).maybeSingle();
  const body=row?.body;
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  const copy=(body as Record<string,unknown>).contracting;
  if(!copy||typeof copy!=='object'||Array.isArray(copy))return null;
  const id=(copy as Record<string,unknown>).heroMediaId;
  if(typeof id!=='string'||!/^[0-9a-f-]{36}$/i.test(id))return null;
  const {data:media}=await db.from('media_assets').select('public_url,sector_id').eq('id',id).maybeSingle();
  if(media?.sector_id&&media.sector_id!==sector.id)return null;
  return media?.public_url||null;
 }catch{return null}
}
