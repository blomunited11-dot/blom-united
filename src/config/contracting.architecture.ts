/**
 * Contracting page architecture — phase 1.
 * This is a declarative inventory of the ACTUAL sections rendered by
 * ContractingExperience.tsx. It does not mutate content or presentation.
 * Future admin fields must be registered here AND consumed by the renderer.
 */
export type ContractingSectionId =
  | 'hero' | 'capabilities' | 'domains' | 'portfolio'
  | 'lifecycle' | 'delivery' | 'standards' | 'closing';
export type ContractingField = {
  key: string;
  kind: 'text' | 'rich-text' | 'image' | 'image-collection';
  locale: 'localized' | 'shared';
  editable: boolean;
  note?: string;
};
export type ContractingSection = {
  id: ContractingSectionId;
  labelAr: string;
  source: 'component' | 'database' | 'mixed';
  fields: readonly ContractingField[];
};
const text = (key: string): ContractingField => ({key, kind: 'text', locale: 'localized', editable: true});
const image = (key: string, note: string): ContractingField => ({key, kind: 'image', locale: 'shared', editable: false, note});
export const contractingArchitecture: readonly ContractingSection[] = [
  {id:'hero',labelAr:'الواجهة التعريفية',source:'component',fields:[
    text('label'),text('title'),text('lead'),text('intro'),text('seeProjects'),text('contact'),
    image('hero.visual','موضع زخرفي مؤقت ctHeroVisual؛ لا يقرأ صورة من قاعدة البيانات حاليًا')
  ]},
  {id:'capabilities',labelAr:'نطاق الأعمال',source:'mixed',fields:[
    text('capabilities'),text('capIntro'),{key:'services',kind:'rich-text',locale:'localized',editable:false,note:'قائمة ثابتة في المكون، إضافة إلى روابط خدمات منشورة من قاعدة البيانات'}
  ]},
  {id:'domains',labelAr:'القطاعات المستهدفة',source:'component',fields:[
    text('domainsTitle'),{key:'domains',kind:'rich-text',locale:'localized',editable:false}
  ]},
  {id:'portfolio',labelAr:'المشاريع والأعمال',source:'mixed',fields:[
    text('workTitle'),text('workIntro'),{key:'projects',kind:'rich-text',locale:'localized',editable:false,note:'سبعة مشاريع ثابتة بمراحلها، منفصلة عن قائمة المشاريع المنشورة'},
    {key:'case.media',kind:'image-collection',locale:'shared',editable:false,note:'سبعة مواضع ctCaseMedia مؤقتة؛ لم ترتبط بعد بمعرفات مشاريع قاعدة البيانات'}
  ]},
  {id:'lifecycle',labelAr:'مراحل التنفيذ',source:'component',fields:[
    text('lifecycle'),text('lifecycleIntro'),{key:'steps',kind:'rich-text',locale:'localized',editable:false}
  ]},
  {id:'delivery',labelAr:'الإدارة المتكاملة',source:'component',fields:[
    text('integrated'),text('integratedIntro'),{key:'integratedItems',kind:'rich-text',locale:'localized',editable:false}
  ]},
  {id:'standards',labelAr:'الجودة والسلامة والاستدامة',source:'component',fields:[
    text('standards'),{key:'standardsItems',kind:'rich-text',locale:'localized',editable:false}
  ]},
  {id:'closing',labelAr:'الخاتمة والتواصل',source:'component',fields:[
    text('end'),text('contact'),text('return')
  ]}
] as const;
export function getContractingArchitecture(): readonly ContractingSection[] {
  return contractingArchitecture;
}

/** Only scalar copy fields are editable in phase 2. Arrays, links and media remain locked. */
export const contractingEditableTextKeys = [...new Set(contractingArchitecture.flatMap(section => section.fields.filter(field => field.kind === 'text' && field.editable).map(field => field.key)))];
