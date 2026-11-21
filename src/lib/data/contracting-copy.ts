import type {Locale} from '@/lib/i18n/dictionary';
import {contractingDefaultContent} from '@/config/contracting.content';

type DeepWritable<T> =
 T extends string ? string :
 T extends readonly (infer U)[] ? DeepWritable<U>[] :
 T extends object ? {[K in keyof T]:DeepWritable<T[K]>} : T;
type DeepPartial<T> =
 T extends string ? string :
 T extends readonly (infer U)[] ? DeepPartial<U>[] :
 T extends object ? {[K in keyof T]?:DeepPartial<T[K]>} : T;

export type ContractingProject={
 key:string;
 mediaId:string|null;
 name:string;
 category:string;
 scope:string;
 stages:string[];
};
export type ContractingContent=Omit<DeepWritable<typeof contractingDefaultContent.ar>,'projects'|'serviceMediaIds'|'qualityMediaIds'>&{projects:ContractingProject[];serviceMediaIds:(string|null)[];qualityMediaIds:(string|null)[]};
export type ContractingCopy=Omit<DeepPartial<typeof contractingDefaultContent.ar>,'projects'|'serviceMediaIds'|'qualityMediaIds'>&{
 serviceMediaIds?:(string|null)[];
 qualityMediaIds?:(string|null)[];
 projects?:DeepPartial<ContractingProject>[];
 heroMediaId?:string;
};

export function mergeContractingCopy(locale:Locale,...copies:ContractingCopy[]):ContractingContent{
 const base=structuredClone(contractingDefaultContent[locale]) as unknown as ContractingContent;
 const merged=copies.reduce<ContractingCopy>((result,copy)=>{
  const content={...copy};
  delete content.heroMediaId;
  return {...result,...content,pages:{...result.pages,...content.pages}};
 },{});
 // Earlier published drafts contain three legacy standards cards. They must not
 // override the six-card section introduced later.
 const legacyStandards=merged.standardsItems;
 const isLegacyStandards=Array.isArray(legacyStandards)&&legacyStandards.length===3&&
  legacyStandards.every(item=>['الجودة','السلامة','الاستدامة','Quality','Safety','Sustainability'].includes(item?.name||''));
 const resolvedStandards=isLegacyStandards?{standardsItems:base.standardsItems,...((merged.standards==='الجودة والسلامة والاستدامة'||merged.standards==='Quality, safety and sustainability')?{standards:base.standards}:{})}:{};
 const projects=merged.projects?.map((project,index)=>{
  const defaultProject=base.projects.find(item=>item.key===project.key)||base.projects[index];
  return {
   ...defaultProject,
   ...project,
   key:project.key||defaultProject?.key||`contracting-portfolio-${index+1}`,
   mediaId:project.mediaId===undefined?defaultProject?.mediaId??null:project.mediaId
  };
 });
 return {...base,...merged,...resolvedStandards,...(projects?{projects}:{}),pages:{...base.pages,...merged.pages}} as ContractingContent;
}
