import Link from 'next/link';
import {notFound} from 'next/navigation';
import {localeOf} from '@/lib/i18n/dictionary';
import {published} from '@/lib/data/site';
import {contractingDefaultContent} from '@/components/contracting/ContractingExperience';
import {getContractingCopy} from '@/lib/data/contracting';
import {contractingPages,contractingServicePages} from '@/config/contracting.pages';
import '@/components/contracting/contracting.css';
export const dynamic='force-dynamic';
export function generateStaticParams(){return []}
type Props={params:Promise<{locale:string;page:string}>};
export default async function ContractingInnerPage({params}:Props){
 const {locale,page}=await params;
 const l=localeOf(locale);
 const definition=contractingPages.find(x=>x.slug===page);
 if(!definition)notFound();
 const copy=await getContractingCopy(l);
 const t={...contractingDefaultContent[l],...copy};
 const root=`/${l}/sectors/contracting`;
 const service=contractingServicePages.find(x=>x.slug===page);
 const [sector]= (await published('sectors',l)).filter(x=>x.slug==='contracting');
 const projects=sector?await published('projects',l,sector.id):[];
 const services=sector?await published('services',l,sector.id):[];
 const projectList=projects.length?projects.map(p=>({id:p.id,title:p.title,summary:p.summary,slug:p.slug,live:true as const})):t.projects.map((p,i)=>({id:String(i),title:p.name,summary:p.scope,slug:'',live:false as const}));
 return <main className="contracting">
  <section className="ctHero"><div className="ctWrap ctHeroGrid"><div className="ctHeroText">
   <span className="ctKicker">BLOM UNITED / {l==='ar'?'المقاولات':'CONTRACTING'}</span>
   <h1>{definition[l]}</h1>
   <p className="ctIntro">{service?service[l==='ar'?'arDescription':'enDescription']:page==='projects'?t.workIntro:page==='project-lifecycle'?t.lifecycleIntro:page==='integrated-delivery'?t.integratedIntro:page==='quality-safety'?t.standards: t.intro}</p>
   <div className="ctActions"><Link className="ctPrimary" href={root}>{l==='ar'?'بوابة المقاولات':'Contracting portal'}</Link><Link className="ctSecondary" href={`/${l}/contact`}>{t.contact}</Link></div>
  </div></div></section>
  <div className="ctWrap" style={{paddingTop:32,paddingBottom:24}}>
   <nav aria-label={l==='ar'?'صفحات المقاولات':'Contracting pages'} style={{display:'flex',gap:12,flexWrap:'wrap'}}>
    {contractingPages.map(p=><Link key={p.slug} href={`${root}/${p.slug}`} aria-current={p.slug===page?'page':undefined} style={{padding:'8px 12px',border:'1px solid currentColor',borderRadius:8,fontWeight:p.slug===page?700:400}}>{p[l]}</Link>)}
   </nav>
  </div>
  {service?<section className="ctSection ctWrap"><div className="ctSectionHead"><h2>{l==='ar'?'نطاق الخدمة':'Service scope'}</h2></div>
   <p>{service[l==='ar'?'arDescription':'enDescription']}</p>
   <div className="ctLiveList"><h3>{l==='ar'?'الخدمات المنشورة':'Published services'}</h3>{services.map(s=><Link key={s.id} href={`/${l}/sectors/contracting/services/${s.slug}`}>{s.title}</Link>)}</div>
   <p>{l==='ar'?'صور الخدمة المعتمدة تُدار عبر مكتبة وسائط القطاع.':'Approved service imagery is managed in the sector media library.'}</p>
  </section>:page==='projects'?<section className="ctSection ctWrap"><div className="ctSectionHead"><h2>{t.workTitle}</h2></div><div className="ctCaseGrid">
   {projectList.map((p,i)=><article className="ctCase" key={p.id}><div className="ctCaseBody"><span className="ctKicker">{String(i+1).padStart(2,'0')}</span><h3>{p.title}</h3><p>{p.summary}</p>{p.live&&<Link href={`/${l}/projects/${p.slug}`}>{t.more}</Link>}</div></article>)}
  </div></section>:page==='project-lifecycle'?<section className="ctSection ctWrap"><h2>{t.lifecycle}</h2><div className="ctLifecycle">{t.steps.map((s,i)=><div key={i}><span>{String(i+1).padStart(2,'0')}</span><h3>{s}</h3></div>)}</div></section>:page==='integrated-delivery'?<section className="ctSection ctWrap"><h2>{t.integrated}</h2><div className="ctDelivery">{t.integratedItems.map((s,i)=><div key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{s}</p></div>)}</div></section>:page==='quality-safety'?<section className="ctSection ctWrap"><h2>{t.standards}</h2><div className="ctStandards">{t.standardsItems.map((s,i)=><article key={i}><span>{String(i+1).padStart(2,'0')}</span><h3>{s.name}</h3><p>{s.text}</p></article>)}</div></section>:<section className="ctSection ctWrap"><h2>{t.contact}</h2><p>{t.intro}</p><Link className="ctPrimary" href={`/${l}/contact`}>{t.contact}</Link></section>}
  <section className="ctClosing"><div className="ctWrap ctClosingInner"><p>{t.end}</p><Link href={root}>{l==='ar'?'العودة لبوابة المقاولات':'Back to contracting'}</Link></div></section>
 </main>;
}
