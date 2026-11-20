import Link from 'next/link';
import type {Locale} from '@/lib/i18n/dictionary';
import type {Entry} from '@/lib/data/site';
import {mergeContractingCopy,type ContractingCopy} from '@/lib/data/contracting';
import {contractingPages,contractingServicePages,type ContractingPageSlug} from '@/config/contracting.pages';
import './contracting.css';

export default function ContractingInnerExperience({locale,page,copy={},services,projects}:{locale:Locale;page:ContractingPageSlug;copy?:ContractingCopy;services:Entry[];projects:Entry[]}){
 const t=mergeContractingCopy(locale,copy);
 const definition=contractingPages.find(item=>item.slug===page);
 if(!definition)return null;
 const pageCopy=t.pages[page];
 const root=`/${locale}/sectors/contracting`;
 const service=contractingServicePages.find(item=>item.slug===page);
 const projectList=projects.length
  ?projects.map(item=>({id:item.id,title:item.title,summary:item.summary,slug:item.slug,live:true as const}))
  :t.projects.map((item,index)=>({id:String(index),title:item.name,summary:item.scope,slug:'',live:false as const}));
 return <main className="contracting">
  <section className="ctHero"><div className="ctWrap ctHeroGrid"><div className="ctHeroText">
   <span className="ctKicker">BLOM UNITED / {locale==='ar'?'المقاولات':'CONTRACTING'}</span>
   <h1>{pageCopy.title}</h1>
   <p className="ctIntro">{pageCopy.description}</p>
   <div className="ctActions"><Link className="ctPrimary" href={root}>{locale==='ar'?'بوابة المقاولات':'Contracting portal'}</Link><Link className="ctSecondary" href={`/${locale}/contact`}>{t.contact}</Link></div>
  </div></div></section>
  <div className="ctWrap" style={{paddingTop:32,paddingBottom:24}}>
   <nav aria-label={locale==='ar'?'صفحات المقاولات':'Contracting pages'} style={{display:'flex',gap:12,flexWrap:'wrap'}}>
    {contractingPages.map(item=><Link key={item.slug} href={`${root}/${item.slug}`} aria-current={item.slug===page?'page':undefined} style={{padding:'8px 12px',border:'1px solid currentColor',borderRadius:8,fontWeight:item.slug===page?700:400}}>{t.pages[item.slug].title}</Link>)}
   </nav>
  </div>
  {service?<section className="ctSection ctWrap"><div className="ctSectionHead"><h2>{locale==='ar'?'نطاق الخدمة':'Service scope'}</h2></div>
   <p>{pageCopy.description}</p>
   <div className="ctLiveList"><h3>{t.publishedServices}</h3>{services.map(item=><Link key={item.id} href={`/${locale}/sectors/contracting/services/${item.slug}`}>{item.title}</Link>)}</div>
   <p>{locale==='ar'?'صور الخدمة المعتمدة تُدار عبر مكتبة وسائط القطاع.':'Approved service imagery is managed in the sector media library.'}</p>
  </section>:page==='projects'?<section className="ctSection ctWrap"><div className="ctSectionHead"><h2>{t.workTitle}</h2></div><div className="ctCaseGrid">
   {projectList.map((item,index)=><article className="ctCase" key={item.id}><div className="ctCaseBody"><span className="ctKicker">{String(index+1).padStart(2,'0')}</span><h3>{item.title}</h3><p>{item.summary}</p>{item.live&&<Link href={`/${locale}/projects/${item.slug}`}>{t.more}</Link>}</div></article>)}
  </div></section>:page==='project-lifecycle'?<section className="ctSection ctWrap"><h2>{t.lifecycle}</h2><div className="ctLifecycle">{t.steps.map((item,index)=><div key={index}><span>{String(index+1).padStart(2,'0')}</span><h3>{item}</h3></div>)}</div></section>:page==='integrated-delivery'?<section className="ctSection ctWrap"><h2>{t.integrated}</h2><div className="ctDelivery">{t.integratedItems.map((item,index)=><div key={index}><span>{String(index+1).padStart(2,'0')}</span><p>{item}</p></div>)}</div></section>:page==='quality-safety'?<section className="ctSection ctWrap"><h2>{t.standards}</h2><div className="ctStandards">{t.standardsItems.map((item,index)=><article key={index}><span>{String(index+1).padStart(2,'0')}</span><h3>{item.name}</h3><p>{item.text}</p></article>)}</div></section>:<section className="ctSection ctWrap"><h2>{pageCopy.title}</h2><p>{pageCopy.description}</p><Link className="ctPrimary" href={`/${locale}/contact`}>{t.contact}</Link></section>}
  <section className="ctClosing"><div className="ctWrap ctClosingInner"><p>{t.end}</p><Link href={root}>{locale==='ar'?'العودة لبوابة المقاولات':'Back to contracting'}</Link></div></section>
 </main>;
}
