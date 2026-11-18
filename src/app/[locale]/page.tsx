import Link from 'next/link';
import {dict,sectors,localeOf} from '@/lib/i18n/dictionary';
import {published} from '@/lib/data/site';
export const dynamic='force-dynamic';
export default async function Home({params}:{params:Promise<{locale:string}>}){
 const locale=localeOf((await params).locale),d=dict[locale],items=await published('sectors',locale);
 return <main>
  <section className="blomOpening" aria-labelledby="blomOpeningTitle">
   <div className="container blomOpeningGrid">
    <div className="blomOpeningArtwork" role="img" aria-label={locale==='ar'?'رمز بلوم المتحدة مع مشهد مدينة سعودية':'BLOM UNITED symbol with Saudi cityscape'}>
     <div className="blomOpeningB" aria-hidden="true"/>
    </div>
    <div className="blomOpeningContent">
     <h1 id="blomOpeningTitle">{locale==='ar'?<>مجموعة<br/>بلوم المتحدة</>:<>BLOM<br/>UNITED</>}</h1>
     <p className="blomOpeningTagline">{d.subtitle}</p>
     <div className="blomOpeningAccent" aria-hidden="true"><span/><span/></div>
     <p className="blomOpeningDescription">{locale==='ar'?'مجموعة سعودية رائدة تجمع بين الخبرة والتنمية المستدامة في المقاولات والتطوير العقاري، الصناعة، الضيافة، والخدمات الإدارية وتأسيس الأعمال.':'A leading Saudi group bringing together expertise and sustainable development across contracting and real estate, industry, hospitality, and business services.'}</p>
    </div>
   </div>
  </section>
  <section className="section container homeSectors" aria-labelledby="sectors-heading">
   <h2 id="sectors-heading">{d.sectors}</h2>
   <div className="cards">{sectors.map(s=>{const x=items.find(v=>v.slug===s.slug);return <Link className="card" key={s.slug} href={`/${locale}/sectors/${s.slug}`}>{x?.cover?<img className="cardImage" src={x.cover} alt={x.title}/>:<div className="cardImage" aria-hidden="true"/>}<div className="cardBody"><h3>{x?.title||s[locale]}</h3>{x?.summary&&<p>{x.summary}</p>}<span className="muted">{d.explore}</span></div></Link>})}</div>
  </section>
 </main>;
}
