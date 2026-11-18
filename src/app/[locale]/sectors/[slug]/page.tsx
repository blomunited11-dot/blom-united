import {notFound} from 'next/navigation';
import {dict,localeOf} from '@/lib/i18n/dictionary';
import {published} from '@/lib/data/site';
import Link from 'next/link';
export const dynamic='force-dynamic';
export default async function Sector({params}:{params:Promise<{locale:string;slug:string}>}){
 const {locale,slug}=await params,l=localeOf(locale);
 const sector=(await published('sectors',l)).find(x=>x.slug===slug);
 if(!sector)notFound();
 const [services,projects]=await Promise.all([published('services',l,sector.id),published('projects',l,sector.id)]);
 return <main className="container page"><h1>{sector.title}</h1><p>{sector.summary||dict[l].noContent}</p>
 <h2>{l==='ar'?'الخدمات':'Services'}</h2><div className="cards">{services.map(x=><Link className="card cardBody" key={x.id} href={`/${l}/sectors/${slug}/services/${x.slug}`}>{x.title}</Link>)}</div>
 <h2>{dict[l].projects}</h2><div className="cards">{projects.map(x=><Link className="card cardBody" key={x.id} href={`/${l}/projects/${x.slug}`}>{x.title}</Link>)}</div></main>;
}