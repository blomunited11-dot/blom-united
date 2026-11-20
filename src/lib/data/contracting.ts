import type {Locale} from '@/lib/i18n/dictionary';
import {serverDb} from '@/lib/supabase/server';
import {contractingDefaultContent} from '@/config/contracting.content';
import {mergeContractingCopy} from '@/lib/data/contracting-copy';
import type {ContractingContent,ContractingCopy} from '@/lib/data/contracting-copy';

export {mergeContractingCopy};
export type {ContractingContent,ContractingCopy};

export type ContractingDraftRead={
 authorized:boolean;
 found:boolean;
 copy:ContractingCopy;
 heroMediaId:string|null;
 heroImage:string|null;
 updatedAt:string|null;
};

function isRecord(value:unknown):value is Record<string,unknown>{
 return Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
}

function sanitizeLike(value:unknown,shape:unknown):unknown{
 if(typeof shape==='string')return typeof value==='string'&&value.length<=3000?value:undefined;
 if(Array.isArray(shape)){
  if(!Array.isArray(value)||value.length>30)return undefined;
  const result=value.map(item=>sanitizeLike(item,shape[0]));
  return result.every(item=>item!==undefined)?result:undefined;
 }
 if(isRecord(shape)){
  if(!isRecord(value))return undefined;
  const result:Record<string,unknown>={};
  for(const [key,childShape] of Object.entries(shape)){
   const sanitized=sanitizeLike(value[key],childShape);
   if(sanitized!==undefined)result[key]=sanitized;
  }
  return Object.keys(result).length?result:undefined;
 }
 return undefined;
}

/** Read only the known contracting shape from the sector's namespaced content. */
export function readContractingCopy(body:unknown):ContractingCopy{
 if(!isRecord(body)||!isRecord(body.contracting))return {};
 const raw=body.contracting;
 const copy=sanitizeLike(raw,contractingDefaultContent.ar) as ContractingCopy|undefined;
 const heroMediaId=typeof raw.heroMediaId==='string'&&/^[0-9a-f-]{36}$/i.test(raw.heroMediaId)?raw.heroMediaId:undefined;
 return {...(copy||{}),...(heroMediaId?{heroMediaId}:{})};
}

export function validateContractingDraftCopy(value:unknown):ContractingContent{
 function validate(current:unknown,shape:unknown,path:string):unknown{
  if(typeof shape==='string'){
   if(typeof current!=='string'||!current.trim()||current.length>3000){
    throw new Error(`Invalid or empty text: ${path}`);
   }
   return current.trim();
  }
  if(Array.isArray(shape)){
   let maximum=30;
   if(path.endsWith('.domains')||path.endsWith('.steps')||path.endsWith('.integratedItems'))maximum=20;
   if(path.endsWith('.standardsItems')||path.endsWith('.stages'))maximum=10;
   if(!Array.isArray(current)||current.length<1||current.length>maximum){
    throw new Error(`Invalid list: ${path}`);
   }
   if(path.endsWith('.services')&&current.length!==shape.length)throw new Error('Exactly six service links are required');
   return current.map((item,index)=>validate(item,shape[0],`${path}.${index}`));
  }
  if(isRecord(shape)){
   if(!isRecord(current))throw new Error(`Invalid object: ${path}`);
   const expected=Object.keys(shape).sort();
   const actual=Object.keys(current).sort();
   if(expected.length!==actual.length||expected.some((key,index)=>key!==actual[index])){
    throw new Error(`Invalid fields: ${path}`);
   }
   return Object.fromEntries(expected.map(key=>[key,validate(current[key],shape[key],`${path}.${key}`)]));
  }
  throw new Error(`Unsupported field: ${path}`);
 }
 return validate(value,contractingDefaultContent.ar,'contracting') as ContractingContent;
}

export async function getContractingCopy(locale:Locale):Promise<ContractingCopy>{
 const db=await serverDb();
 const {data:sector,error}=await db.from('sectors').select('id').eq('slug','contracting').eq('status','published').maybeSingle();
 if(error)throw new Error(error.message);
 if(!sector)return {};
 const {data:translation,error:translationError}=await db.from('content_translations').select('body').eq('entity_type','sector').eq('entity_id',sector.id).eq('locale',locale).maybeSingle();
 if(translationError)throw new Error(translationError.message);
 return readContractingCopy(translation?.body);
}

async function getContractingMediaUrl(db:Awaited<ReturnType<typeof serverDb>>,mediaId:string|null):Promise<string|null>{
 if(!mediaId)return null;
 const [{data:sector,error:sectorError},{data:media,error:mediaError}]=await Promise.all([
  db.from('sectors').select('id').eq('slug','contracting').maybeSingle(),
  db.from('media_assets').select('public_url,sector_id').eq('id',mediaId).maybeSingle()
 ]);
 if(sectorError)throw new Error(sectorError.message);
 if(mediaError)throw new Error(mediaError.message);
 if(!sector||!media?.public_url||(media.sector_id&&media.sector_id!==sector.id))return null;
 return media.public_url;
}

export async function getContractingDraft(locale:Locale):Promise<ContractingDraftRead>{
 const db=await serverDb();
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError)throw new Error(authError.message);
 if(!user)return {authorized:false,found:false,copy:{},heroMediaId:null,heroImage:null,updatedAt:null};
 const {data:membership,error:membershipError}=await db.from('admin_memberships').select('role').eq('user_id',user.id).eq('active',true).maybeSingle();
 if(membershipError)throw new Error(membershipError.message);
 if(membership?.role!=='owner')return {authorized:false,found:false,copy:{},heroMediaId:null,heroImage:null,updatedAt:null};
 const {data:draft,error:draftError}=await db.from('contracting_content_drafts').select('content,hero_media_id,updated_at').eq('locale',locale).maybeSingle();
 if(draftError)throw new Error(draftError.message);
 if(!draft)return {authorized:true,found:false,copy:{},heroMediaId:null,heroImage:null,updatedAt:null};
 return {
  authorized:true,
  found:true,
  copy:sanitizeLike(draft.content,contractingDefaultContent.ar) as ContractingCopy||{},
  heroMediaId:draft.hero_media_id,
  heroImage:await getContractingMediaUrl(db,draft.hero_media_id),
  updatedAt:draft.updated_at
 };
}

export async function getContractingDraftPreview(locale:Locale):Promise<ContractingDraftRead>{
 return getContractingDraft(locale);
}

export async function getContractingHeroImage(locale:Locale):Promise<string|null>{
 const db=await serverDb();
 const {data:sector,error:sectorError}=await db.from('sectors').select('id').eq('slug','contracting').eq('status','published').maybeSingle();
 if(sectorError)throw new Error(sectorError.message);
 if(!sector)return null;
 const {data:row,error:translationError}=await db.from('content_translations').select('body').eq('entity_type','sector').eq('entity_id',sector.id).eq('locale',locale).maybeSingle();
 if(translationError)throw new Error(translationError.message);
 const mediaId=readContractingCopy(row?.body).heroMediaId;
 return getContractingMediaUrl(db,mediaId||null);
}
