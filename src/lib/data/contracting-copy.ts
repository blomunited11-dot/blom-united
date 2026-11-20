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

export type ContractingContent=DeepWritable<typeof contractingDefaultContent.ar>;
export type ContractingCopy=DeepPartial<typeof contractingDefaultContent.ar>&{heroMediaId?:string};

export function mergeContractingCopy(locale:Locale,...copies:ContractingCopy[]):ContractingContent{
 const base=structuredClone(contractingDefaultContent[locale]) as unknown as ContractingContent;
 const merged=copies.reduce<ContractingCopy>((result,copy)=>{
  const content={...copy};
  delete content.heroMediaId;
  return {...result,...content,pages:{...result.pages,...content.pages}};
 },{});
 return {...base,...merged,pages:{...base.pages,...merged.pages}} as ContractingContent;
}
