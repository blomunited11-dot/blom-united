import Link from 'next/link';
import { dict, sectors, localeOf } from '@/lib/i18n/dictionary';
import { published } from '@/lib/data/site';

export const dynamic = 'force-dynamic';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale = localeOf((await params).locale);
  const d = dict[locale];
  const items = await published('sectors', locale);

  return (
    <main>
      <section className="homeHero" aria-labelledby="home-heading">
        <div className="container homeHeroInner">
          <div className="homeHeroCopy">
            <span className="homeEyebrow">{locale === 'ar' ? 'BLOM UNITED' : 'مجموعة بلوم المتحدة'}</span>
            <h1 id="home-heading">{d.title}</h1>
            <div className="homeHeroRule" aria-hidden="true" />
            <p>{d.subtitle}</p>
            <Link className="homeHeroLink" href={`/${locale}/sectors`}>
              {d.sectors}<span aria-hidden="true">{locale === 'ar' ? '←' : '→'}</span>
            </Link>
          </div>
          <div className="homeHeroVisual" aria-hidden="true">
            <div className="homeHeroOrbit homeHeroOrbitOne" />
            <div className="homeHeroOrbit homeHeroOrbitTwo" />
            <div className="homeHeroMark"><span className="homeHeroMarkStem" /><span className="homeHeroMarkTop" /><span className="homeHeroMarkBottom" /></div>
            <div className="homeHeroVisualLabel">BLOM <span>UNITED</span></div>
          </div>
        </div>
        <div className="homeHeroBottom container">
          <span>{locale === 'ar' ? 'مجموعة بلوم المتحدة' : 'BLOM UNITED'}</span>
          <span>{locale === 'ar' ? 'اكتشف مجالات أعمالنا' : 'Discover our sectors'} ↓</span>
        </div>
      </section>
      <section className="section container homeSectors" aria-labelledby="sectors-heading">
        <div className="homeSectionHeading">
          <span className="homeEyebrow">BLOM UNITED / 04</span>
          <h2 id="sectors-heading">{d.intro}</h2>
        </div>
        <div className="cards">
          {sectors.map((sector, index) => {
            const content = items.find(item => item.slug === sector.slug);
            return <Link className="card homeSectorCard" key={sector.slug} href={`/${locale}/sectors/${sector.slug}`}>
              {content?.cover ? <img className="cardImage" src={content.cover} alt={content.title} /> : <div className="cardImage homeSectorPlaceholder" aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span></div>}
              <div className="cardBody">
                <span className="homeSectorNumber">0{index + 1} / 04</span>
                <h3>{content?.title || sector[locale]}</h3>
                {content?.summary && <p>{content.summary}</p>}
                <span className="homeSectorExplore">{d.explore} <span aria-hidden="true">{locale === 'ar' ? '↖' : '↗'}</span></span>
              </div>
            </Link>;
          })}
        </div>
      </section>
    </main>
  );
}
