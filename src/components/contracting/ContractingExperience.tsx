import Link from 'next/link';
import type {ReactNode} from 'react';
import type {Locale} from '@/lib/i18n/dictionary';
import type {Entry} from '@/lib/data/site';
import type {ContractingCopy} from '@/lib/data/contracting';
import './contracting.css';
import {contractingPages,contractingServicePages} from '@/config/contracting.pages';

export const contractingDefaultContent={
 ar:{
  title:'المقاولات والتطوير العقاري',label:'قطاع المقاولات / BLOM UNITED',
  lead:'نحوّل التخطيط الدقيق إلى تنفيذ منضبط.',
  intro:'بلوم المتحدة شركة مقاولات متكاملة تُحوّل التخطيط الدقيق إلى تنفيذ منضبط. نُدير المشروع كوحدة واحدة: نطاق واضح، جدول محكوم، وجودة تُقاس بالتفاصيل.',
  seeProjects:'استكشف الأعمال',contact:'تواصل معنا',photo:'موضع الصورة المعتمدة',pending:'تُضاف الصورة الأصلية عبر مكتبة الوسائط',
  capabilities:'نطاق أعمال متكامل',capIntro:'من الإنشاء إلى التشغيل، تجمع بلوم التخصصات اللازمة لتنسيق العمل وتحقيق نتائج قابلة للقياس.',
  services:['المقاولات العامة وإدارة التنفيذ','الإنشاءات والهياكل الخرسانية','أعمال التشغيل والصيانة','الأعمال المعمارية والتشطيبات','الأعمال الكهروميكانيكية','البنية التحتية والموقع العام'],
  domainsTitle:'القطاعات التي نخدمها',domains:['القطاع الحكومي والمرافق','الرعاية الصحية والعيادات','التعليم والإسكان الجامعي','الضيافة والفنادق','التجاري والمكاتب الإدارية','السكني والتطوير العقاري'],
  workTitle:'أعمال تحكي التجربة',workIntro:'نماذج من الأعمال الواردة في الملف التعريفي. تظهر هنا مواضع الصور إلى حين اعتماد المواد الأصلية ونشرها.',
  projects:[
   {name:'مجمع طيبة الطبي',category:'الرعاية الصحية',scope:'إحلال وتجديد المبنى، مع أعمال الواجهات والتشطيبات والتجهيز للتشغيل.',stages:['أثناء التنفيذ','بعد الإنجاز']},
   {name:'نادي المسيرة الرياضي',category:'المنشآت الرياضية',scope:'أعمال طبقة التأسيس وتجهيز الموقع، موثقة بمراحل التنفيذ.',stages:['قبل التنفيذ','أثناء التنفيذ','بعد التنفيذ']},
   {name:'المختبرات المركزية بالجوف',category:'الأعمال التخصصية',scope:'أعمال الأرضيات الفينيل ومعالجة الوصلات والتشطيبات.',stages:['أثناء التنفيذ','بعد الإنجاز']},
   {name:'مستشفى الأمير متعب',category:'المنشآت الصحية',scope:'أعمال دهانات الواجهات وتجهيزها وتسليمها.',stages:['أثناء التنفيذ','بعد الإنجاز']},
   {name:'مقر بلوم المتحدة',category:'الأعمال الإدارية',scope:'رفع كفاءة المقر، بما يشمل التشطيبات الداخلية والواجهات ومساحات العمل.',stages:['أثناء التنفيذ','بعد الإنجاز']},
   {name:'مقر إمارة منطقة الجوف',category:'المرافق الحكومية',scope:'أعمال الواجهات والقواطع والممرات والمواقف والتشطيبات.',stages:['قبل التنفيذ','أثناء التنفيذ','بعد الإنجاز']},
   {name:'مشاريع الفلل والدوبلكسات',category:'المشاريع السكنية',scope:'أعمال الموقع والأساسات والهياكل والعزل والتشطيبات.',stages:['أعمال الأساسات','الهيكل والتشطيب','الواجهات']}
  ],
  lifecycle:'من الفكرة إلى التسليم',lifecycleIntro:'ثماني مراحل مترابطة كما يعرضها الملف التعريفي، لكل مرحلة مسؤولية ومخرجات واضحة.',
  steps:['الفكرة ودراسة الجدوى','التصميم والتراخيص','أعمال الموقع والحفر','الأساسات والخرسانة','المباني والأعمال المعمارية','الكهروميكانيك والتمديدات','التشطيبات النهائية','التشغيل والتسليم والضمان'],
  integrated:'إدارة متكاملة للمشروع',integratedIntro:'فريق واحد ونقطة تحكم واحدة، مع تنسيق الأعمال والقرارات والتسليم.',
  integratedItems:['إدارة النطاق والبرنامج الزمني','المشتريات والتوريد والموردين','إدارة المقاولين المتخصصين','تقارير تقدم واضحة وقرارات أسرع','تسليم منظم مع توثيق وتشغيل'],
  standards:'الجودة والسلامة والاستدامة',
  standardsItems:[{name:'الجودة',text:'إجراءات للفحص والاعتماد والمتابعة، وتوثيق مستمر يقلل المخاطر.'},{name:'السلامة',text:'استباق المخاطر، والتدريب المستمر، ومسؤولية مشتركة في كل موقع.'},{name:'الاستدامة',text:'تقليل الهدر، ورفع كفاءة الموارد، واختيار واعٍ للمواد والأساليب.'}],
  published:'المشاريع المنشورة',publishedServices:'الخدمات المنشورة',more:'عرض التفاصيل',return:'العودة إلى قطاعات المجموعة',end:'من أول خط على الورق إلى آخر تفصيل في الموقع.'
 },
 en:{
  title:'Contracting & Real Estate Development',label:'CONTRACTING / BLOM UNITED',
  lead:'Precise planning. Disciplined execution.',
  intro:'BLOM UNITED is an integrated contracting company turning precise planning into disciplined execution. One scope, one schedule, one standard.',
  seeProjects:'Explore our work',contact:'Contact us',photo:'Approved image placeholder',pending:'Original imagery to be added through the media library',
  capabilities:'Integrated capabilities',capIntro:'From construction through operation, we coordinate the disciplines required to deliver measurable results.',
  services:['General contracting & construction management','Structural and concrete works','Operation and maintenance works','Architectural works and finishing','MEP systems and services','Infrastructure and external works'],
  domainsTitle:'Sectors we serve',domains:['Government and public facilities','Healthcare and clinics','Education and student housing','Hospitality and hotels','Retail and corporate offices','Residential and real estate'],
  workTitle:'Work that speaks for itself',workIntro:'Examples documented in the company profile. Image spaces remain until original project photography is approved.',
  projects:[
   {name:'Taiba Medical Complex',category:'Healthcare',scope:'Building renovation, facade and finishing works, and preparation for operation.',stages:['During execution','After completion']},
   {name:'Al-Maseera Sports Club',category:'Sports facilities',scope:'Base-course works and site preparation documented through execution.',stages:['Before','During','After']},
   {name:'Central Laboratories, Al-Jouf',category:'Specialist works',scope:'Vinyl flooring, welded joints and finishing works.',stages:['During execution','After completion']},
   {name:'Prince Mutaib Hospital',category:'Healthcare',scope:'Facade painting and finishing works.',stages:['During execution','After completion']},
   {name:'BLOM UNITED Headquarters',category:'Corporate',scope:'Office refurbishment, interior finishes, facades and workspaces.',stages:['During execution','After completion']},
   {name:'Al-Jouf Emirate Headquarters',category:'Government',scope:'Facades, partitions, hardscape, parking and finishes.',stages:['Before','During','After']},
   {name:'Residential Duplex Projects',category:'Residential',scope:'Site works, foundations, concrete structure, waterproofing and finishes.',stages:['Foundations','Structure and finishes','Facades']}
  ],
  lifecycle:'From brief to handover',lifecycleIntro:'Eight connected stages from the company profile, with clear ownership and deliverables.',
  steps:['Brief and feasibility','Design and permits','Site setup and excavation','Foundations and concrete','Blockwork and architecture','MEP installation and testing','Final finishes','Commissioning, handover and warranty'],
  integrated:'Integrated project delivery',integratedIntro:'One team and one point of control, from coordination to handover.',
  integratedItems:['Scope and schedule management','Procurement and vendor coordination','Specialist contractor management','Clear progress reporting and faster decisions','Structured handover and documentation'],
  standards:'Quality, safety and sustainability',
  standardsItems:[{name:'Quality',text:'Inspection, approval and follow-up procedures supported by continuous documentation.'},{name:'Safety',text:'Proactive risk management, training and shared responsibility on every site.'},{name:'Sustainability',text:'Less waste, efficient resource use and considered material choices.'}],
  published:'Published projects',publishedServices:'Published services',more:'View details',return:'Back to group sectors',end:'From the first line on paper to the last detail on site.'
 }
} as const;

export default function ContractingExperience({locale,services,projects,copy={},heroImage=null,editorControls=null}:{locale:Locale;services:Entry[];projects:Entry[];copy?:ContractingCopy;heroImage?:string|null;editorControls?:ReactNode}){
 const t={...contractingDefaultContent[locale],...copy};
 return <main className="contracting">
  {editorControls}
  <section className="ctHero"><div className="ctWrap ctHeroGrid">
   <div className="ctHeroText"><span className="ctKicker">{t.label}</span><h1>{t.title}</h1><p className="ctLead">{t.lead}</p><p className="ctIntro">{t.intro}</p><div className="ctActions"><a href="#ct-projects" className="ctPrimary">{t.seeProjects} <span aria-hidden="true">↗</span></a><Link href={`/${locale}/contact`} className="ctSecondary">{t.contact}</Link></div></div>
   <div className="ctHeroVisual ctImagePlaceholder" role="img" aria-label={t.photo}>{heroImage?<img src={heroImage} alt={t.photo} style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0,zIndex:2}}/>:null}<span className="ctVisualGrid" aria-hidden="true"/><span className="ctVisualOutline" aria-hidden="true"/><span className="ctPlaceholderText">{t.photo}<small>{t.pending}</small></span></div>
  </div></section>
  <nav className="ctLocalNav ctWrap" aria-label={t.title}>{contractingPages.map(p=><Link key={p.slug} href={`/${locale}/sectors/contracting/${p.slug}`}>{p[locale]}</Link>)}</nav>
  <section className="ctSection ctWrap" id="ct-services"><div className="ctSectionHead"><div><span className="ctKicker">01 / CAPABILITIES</span><h2>{t.capabilities}</h2></div><p>{t.capIntro}</p></div><div className="ctCapabilities">{t.services.map((s,i)=><Link className="ctCapability" key={s} href={`/${locale}/sectors/contracting/${contractingServicePages[i].slug}`}><span>{String(i+1).padStart(2,'0')}</span><h3>{s}</h3><span aria-hidden="true">↗</span></Link>)}</div>{services.length>0&&<div className="ctLiveList"><h3>{t.publishedServices}</h3>{services.map(s=><Link key={s.id} href={`/${locale}/sectors/contracting/services/${s.slug}`}>{s.title}<span aria-hidden="true">↗</span></Link>)}</div>}</section>
  <section className="ctBand"><div className="ctWrap"><div className="ctSectionHead"><div><span className="ctKicker">02 / SECTORS</span><h2>{t.domainsTitle}</h2></div></div><div className="ctDomains">{t.domains.map((d,i)=><div key={d}><span>{String(i+1).padStart(2,'0')}</span><h3>{d}</h3></div>)}</div></div></section>
  <section className="ctSection ctWrap" id="ct-projects"><div className="ctSectionHead"><div><span className="ctKicker">03 / PORTFOLIO</span><h2>{t.workTitle}</h2></div><p>{t.workIntro}</p></div><div className="ctCaseGrid">{t.projects.map((p,i)=><article className={i===0?'ctCase ctCaseFeatured':'ctCase'} key={p.name}><div className="ctCaseMedia ctImagePlaceholder"><span className="ctCaseNumber">{String(i+1).padStart(2,'0')}</span><div className="ctCasePlaceholder">{t.photo}<small>{t.pending}</small></div></div><div className="ctCaseBody"><span className="ctKicker">{p.category}</span><h3>{p.name}</h3><p>{p.scope}</p><div className="ctStageTags">{p.stages.map(s=><span key={s}>{s}</span>)}</div></div></article>)}</div>{projects.length>0&&<div className="ctLiveList"><h3>{t.published}</h3>{projects.map(p=><Link key={p.id} href={`/${locale}/projects/${p.slug}`}>{p.title}<span aria-hidden="true">↗</span></Link>)}</div>}</section>
  <section className="ctBand" id="ct-process"><div className="ctWrap"><div className="ctSectionHead"><div><span className="ctKicker">04 / LIFECYCLE</span><h2>{t.lifecycle}</h2></div><p>{t.lifecycleIntro}</p></div><div className="ctLifecycle">{t.steps.map((s,i)=><div key={s}><span>{String(i+1).padStart(2,'0')}</span><h3>{s}</h3></div>)}</div></div></section>
  <section className="ctSection ctWrap"><div className="ctSectionHead"><div><span className="ctKicker">05 / DELIVERY</span><h2>{t.integrated}</h2></div><p>{t.integratedIntro}</p></div><div className="ctDelivery">{t.integratedItems.map((item,i)=><div key={item}><span>{String(i+1).padStart(2,'0')}</span><p>{item}</p></div>)}</div></section>
  <section className="ctBand" id="ct-quality"><div className="ctWrap"><div className="ctSectionHead"><div><span className="ctKicker">06 / STANDARDS</span><h2>{t.standards}</h2></div></div><div className="ctStandards">{t.standardsItems.map((s,i)=><article key={s.name}><span>{String(i+1).padStart(2,'0')}</span><h3>{s.name}</h3><p>{s.text}</p></article>)}</div></div></section>
  <section className="ctClosing"><div className="ctWrap ctClosingInner"><p>{t.end}</p><div className="ctClosingLinks"><Link href={`/${locale}/contact`}>{t.contact}</Link><Link href={`/${locale}/sectors`}>{t.return}</Link></div></div></section>
 </main>
}
