/** Exactly twelve public contracting pages: the sector portal plus these eleven routes. */
export const contractingServicePages=[
 {slug:'general-contracting',ar:'المقاولات العامة وإدارة التنفيذ',en:'General contracting & construction management',arDescription:'إدارة نطاق العمل والبرنامج الزمني والتنسيق بين فرق التنفيذ والموردين.',enDescription:'Scope, schedule, delivery teams and vendor coordination.'},
 {slug:'structural-concrete',ar:'الإنشاءات والهياكل الخرسانية',en:'Structural and concrete works',arDescription:'أعمال الموقع والأساسات والهياكل الخرسانية ومتابعة مراحل الإنشاء.',enDescription:'Site works, foundations, concrete structures and construction stages.'},
 {slug:'operation-maintenance',ar:'أعمال التشغيل والصيانة',en:'Operation and maintenance works',arDescription:'تنظيم أعمال التشغيل والصيانة والتسليم وفق نطاق المشروع.',enDescription:'Operation, maintenance and handover within the project scope.'},
 {slug:'architectural-finishing',ar:'الأعمال المعمارية والتشطيبات',en:'Architectural works and finishing',arDescription:'الأعمال المعمارية والتشطيبات الداخلية والخارجية ومتابعة الجودة.',enDescription:'Architectural works, interior and exterior finishes, and quality follow-up.'},
 {slug:'mep-systems',ar:'الأعمال الكهروميكانيكية',en:'MEP systems and services',arDescription:'تنسيق وتركيب واختبار أنظمة الكهرباء والميكانيكا والتمديدات.',enDescription:'Coordination, installation and testing of mechanical, electrical and plumbing systems.'},
 {slug:'infrastructure',ar:'البنية التحتية والموقع العام',en:'Infrastructure and external works',arDescription:'تجهيز المواقع والأعمال الترابية والطرق والمواقف والأعمال الخارجية.',enDescription:'Site preparation, earthworks, roads, parking and external works.'}
] as const;
export const contractingOtherPages=[
 {slug:'projects',ar:'المشاريع والأعمال',en:'Projects & portfolio'},
 {slug:'project-lifecycle',ar:'دورة حياة المشروع',en:'Project lifecycle'},
 {slug:'quality-safety',ar:'الجودة والسلامة والاستدامة',en:'Quality, safety & sustainability'},
 {slug:'integrated-delivery',ar:'الحلول والإدارة المتكاملة',en:'Integrated delivery'},
 {slug:'contact',ar:'طلب الخدمة والتواصل',en:'Contact & enquiries'}
] as const;
export const contractingPages=[...contractingServicePages,...contractingOtherPages] as const;
export function contractingPageTitle(slug:string,locale:'ar'|'en'){
 const item=contractingPages.find(p=>p.slug===slug);
 return item?.[locale]??null;
}
