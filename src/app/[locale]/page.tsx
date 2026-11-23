import Link from 'next/link';
import BlomClock from '@/components/home/BlomClock';
import {dict,sectors,localeOf} from '@/lib/i18n/dictionary';
import {published} from '@/lib/data/site';
export const dynamic='force-dynamic';
export default async function Home({params}:{params:Promise<{locale:string}>}){
 const locale=localeOf((await params).locale),d=dict[locale],items=await published('sectors',locale);
 return <main>
  <section className="blomOpening" aria-labelledby="blomOpeningTitle">
   <div className="container blomOpeningGrid">
    <div className="blomOpeningArtwork" role="img" aria-label={locale==='ar'?'رمز بلوم المتحدة مع مشهد مدينة سعودية':'BLOM UNITED symbol with Saudi cityscape'}>
     <div className="blomClockArtwork" style={{position:'relative',width:'min(100%, calc((100svh - 120px) * 745 / 771))',maxWidth:'100%',flex:'none'}}>
      <img className="blomOpeningImage" src="/brand/hero-city-b.webp" alt="" width={745} height={771} fetchPriority="high" style={{width:'100%',height:'auto',maxHeight:'none',display:'block'}} />
      {/* Overlay follows the image's intrinsic coordinates at every viewport width. */}
<BlomClock />
     </div>
    </div>
    <div className="blomOpeningContent">
     <h1 id="blomOpeningTitle">{locale==='ar'?<>مجموعة<br/>بلوم المتحدة</>:<>BLOM<br/>UNITED</>}</h1>
     <p className="blomOpeningTagline">{d.subtitle}</p>
     <p className="blomOpeningDescription">{locale==='ar'?'مجموعة سعودية رائدة تجمع بين الخبرة والتنمية المستدامة في المقاولات والتطوير العقاري، الصناعة، الضيافة، والخدمات الإدارية وتأسيس الأعمال.':'A leading Saudi group bringing together expertise and sustainable development across contracting and real estate, industry, hospitality, and business services.'}</p>
    </div>
   </div>
  </section>
  <style>{`@media (max-width:1100px){.blomClockArtwork{width:100%!important}}`}</style>
  <section className="blomSectorsSection" aria-labelledby="sectors-heading">
   <div className="container blomSectorsContainer">
    <div className="blomSectorsHeading">
     <div><span className="blomSectorsEyebrow">BLOM UNITED / 04</span><h2 id="sectors-heading">{d.sectors}</h2></div>
     <p>{d.intro}</p>
    </div>
    <div className="blomSectorGrid">{sectors.map((s,index)=>{const x=items.find(v=>v.slug===s.slug);return <Link className={`blomSectorTile blomSectorTile${index+1}`} key={s.slug} href={`/${locale}/sectors/${s.slug}`}>
      <div className="blomSectorVisual"><img src={`/brand/${String(index+1).padStart(2,'0')}.webp`} alt="" loading="lazy" /></div>
      <div className="blomSectorInfo"><span className="blomSectorIndex">0{index+1} / 04</span><h3>{x?.title||s[locale]}</h3>{x?.summary&&<p>{x.summary}</p>}<span className="blomSectorExplore">{d.explore}<span aria-hidden="true">{locale==='ar'?'↖':'↗'}</span></span></div>
     </Link>})}</div>
   </div>
  </section>
 </main>;
}
