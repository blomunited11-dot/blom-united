'use server';
import {revalidatePath} from 'next/cache';
import {serverDb} from '@/lib/supabase/server';
import {contractingDefaultContent} from '@/config/contracting.content';
import {contractingPages} from '@/config/contracting.pages';
import {validateContractingDraftCopy} from '@/lib/data/contracting';

async function ownerDb(){
 const db=await serverDb();
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)throw new Error('Authentication required');
 const {data:member,error:membershipError}=await db.from('admin_memberships').select('role').eq('user_id',user.id).eq('active',true).maybeSingle();
 if(membershipError||member?.role!=='owner')throw new Error('Owner permission required');
 return db;
}

function formText(form:FormData,name:string):string{
 const value=form.get(name);
 if(typeof value!=='string')throw new Error(`Missing field: ${name}`);
 return value;
}

function buildProjectMediaSelections(form:FormData){
 const selections:{project_id:string;action:'set'|'discard';media_id:string|null}[]=[];
 for(const [name,value] of form.entries()){
  if(!name.startsWith('project_media:'))continue;
  if(typeof value!=='string')throw new Error('Invalid project media selection');
  const projectId=name.slice('project_media:'.length);
  if(!/^[0-9a-f-]{36}$/i.test(projectId))throw new Error('Invalid project media selection');
  if(!value)continue;
  if(value==='__published__'){
   selections.push({project_id:projectId,action:'discard',media_id:null});
  }else if(/^[0-9a-f-]{36}$/i.test(value)){
   selections.push({project_id:projectId,action:'set',media_id:value});
  }else{
   throw new Error('Invalid project media selection');
  }
 }
 return selections;
}

function buildDraftContent(form:FormData,locale:'ar'|'en'){
 const defaults=contractingDefaultContent[locale] as Record<string,unknown>;
 const content:Record<string,unknown>={};
 for(const [key,value] of Object.entries(defaults)){
  if(typeof value==='string'){
   content[key]=formText(form,`text:${key}`).trim();
  }else if(Array.isArray(value)&&value.every(item=>typeof item==='string')){
   content[key]=formText(form,`list:${key}`).split(/\r?\n/).map(item=>item.trim()).filter(Boolean);
  }else if(Array.isArray(value)){
   let parsed:unknown;
   try{parsed=JSON.parse(formText(form,`json:${key}`));}
   catch{throw new Error(`Invalid JSON list: ${key}`);}
   content[key]=parsed;
  }else if(key==='pages'){
   const pageDefaults=value as Record<string,{title:string;description:string}>;
   content.pages=Object.fromEntries(Object.keys(pageDefaults).map(slug=>[slug,{
    title:formText(form,`page:${slug}:title`).trim(),
    description:formText(form,`page:${slug}:description`).trim()
   }]));
  }
 }
 return validateContractingDraftCopy(content);
}

export async function saveContractingDraft(form:FormData){
 const locale=String(form.get('locale')||'');
 if(locale!=='ar'&&locale!=='en')throw new Error('Invalid locale');
 const content=buildDraftContent(form,locale);
 const mediaId=String(form.get('hero_media_id')||'');
 if(mediaId&&!/^[0-9a-f-]{36}$/i.test(mediaId))throw new Error('Invalid media');
 const projectMedia=buildProjectMediaSelections(form);
 const db=await ownerDb();
 const {error}=await db.rpc('save_contracting_editor_draft',{
  p_locale:locale,
  p_content:content,
  p_media_id:mediaId||null,
  p_project_media:projectMedia
 });
 if(error)throw new Error(error.message);
 revalidatePath('/admin/edit/contracting');
 revalidatePath('/admin/contracting');
}

export async function publishContractingDraft(form:FormData){
 const locale=String(form.get('locale')||'');
 if(locale!=='ar'&&locale!=='en')throw new Error('Invalid locale');
 const db=await ownerDb();
 const {error}=await db.rpc('publish_contracting_editor_draft',{p_locale:locale});
 if(error)throw new Error(error.message);
 revalidatePath('/admin/edit/contracting');
 revalidatePath('/admin/contracting');
 for(const pathLocale of ['ar','en']){
  revalidatePath(`/${pathLocale}/sectors/contracting`);
  for(const page of contractingPages)revalidatePath(`/${pathLocale}/sectors/contracting/${page.slug}`);
 }
}
