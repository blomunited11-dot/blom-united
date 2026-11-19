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
