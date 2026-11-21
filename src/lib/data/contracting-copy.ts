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
export type ContractingContent=Omit<DeepWritable<typeof contractingDefaultContent.ar>,'projects'|'serviceMediaIds'|'qualityMediaIds'|'domainMediaIds'>&{projects:ContractingProject[];serviceMediaIds:(string|null)[];qualityMediaIds:(string|null)[];domainMediaIds:(string|null)[]};
export type ContractingCopy=Omit<DeepPartial<typeof contractingDefaultContent.ar>,'projects'|'serviceMediaIds'|'qualityMediaIds'|'domainMediaIds'>&{
 serviceMediaIds?:(string|null)[];
 qualityMediaIds?:(string|null)[];domainMediaIds?:(string|null)[];
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
 // Preserve published custom sector labels while migrating the previous first label.
 // Existing drafts and translations can otherwise override the updated default.
 const resolvedDomains=merged.domains?.map((domain,index)=>index===0&&domain==='القطاع الحكومي والمرافق'?'المباني والمرافق':domain);
 // Keep the three-photo groups together when reading older published content.
 const legacyPortfolioKeys=new Set(['taiba-medical-complex','al-maseera-sports-club','central-laboratories-al-jouf']);
 const galleryKeys=new Set(base.projects.slice(0,9).map(project=>project.key));
 const savedProjects=merged.projects||[];
 const savedByKey=new Map(savedProjects.map(project=>[project.key,project]));
 const legacyTaiba=savedByKey.get('taiba-medical-complex');
 const gallery=base.projects.slice(0,9).map(project=>{
  const saved=savedByKey.get(project.key);
  const oldMedia=project.key==='taiba-medical-complex-before'?legacyTaiba?.mediaId:undefined;
  return {...project,...(saved||{}),mediaId:saved?.mediaId??oldMedia??project.mediaId};
 });
 const remaining=savedProjects.filter(project=>!galleryKeys.has(project.key||'')&&!legacyPortfolioKeys.has(project.key||''));
 const portfolioSource=savedProjects.length
  ?[...gallery,...remaining]
  :undefined;
 const projects=portfolioSource?.map((project,index)=>{
  const defaultProject=base.projects.find(item=>item.key===project.key)||base.projects[index];
  return {
   ...defaultProject,
   ...project,
   key:project.key||defaultProject?.key||`contracting-portfolio-${index+1}`,
   mediaId:project.mediaId===undefined?defaultProject?.mediaId??null:project.mediaId
  };
 });
 return {...base,...merged,...resolvedStandards,...(resolvedDomains?{domains:resolvedDomains}:{}),...(projects?{projects}:{}),pages:{...base.pages,...merged.pages}} as ContractingContent;
}
