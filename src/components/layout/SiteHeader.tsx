'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {dict,sectors,type Locale} from '@/lib/i18n/dictionary';
export function SiteHeader({locale}:{locale:Locale}){
 const d=dict[locale],path=usePathname(),other=locale==='ar'?'en':'ar',otherPath=path.replace(/^\/(ar|en)(?=\/|$)/,`/${other}`);
 return <header className="header blomHeader"><div className="container headerInner">
  <Link className="brand blomBrand" href={`/${locale}`} aria-label={d.title}>
   <span className="blomBrandSymbol" aria-hidden="true"><span className="blomBrandBTop"/><span className="blomBrandBBottom"/></span>
   <span className="blomBrandNames"><strong>بلوم المتحدة</strong><span>BLOM UNITED</span></span>
  </Link>
  <nav className="nav" aria-label={d.sectors}>
   <Link className={path===`/${locale}`?'navActive':''} href={`/${locale}`}>{d.home}</Link>
   <Link href={`/${locale}/about`}>{d.about}</Link>
   <div className="dropdown"><Link href={`/${locale}/sectors`}>{d.sectors} <span aria-hidden="true">⌄</span></Link><div>{sectors.map(s=><Link key={s.slug} href={`/${locale}/sectors/${s.slug}`}>{s[locale]}</Link>)}</div></div>
   <Link href={`/${locale}/projects`}>{d.projects}</Link>
   <Link href={`/${locale}/news`}>{d.news}</Link>
   <Link href={`/${locale}/media`}>{d.media}</Link>
   <Link href={`/${locale}/contact`}>{d.contact}</Link>
  </nav>
  <div className="blomHeaderTools"><Link className="blomLanguage" href={otherPath} aria-label="Switch language">{other.toUpperCase()} <span aria-hidden="true">⌄</span></Link><Link className="blomSearch" href={`/${locale}/sectors`} aria-label={d.sectors}><span aria-hidden="true"/></Link></div>
 </div></header>;
}
