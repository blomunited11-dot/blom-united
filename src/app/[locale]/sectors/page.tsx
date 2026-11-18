import Link from 'next/link';
import {dict,localeOf} from '@/lib/i18n/dictionary';
import {published} from '@/lib/data/site';
export const dynamic='force-dynamic';
export default async function Sectors({params}:{params:Promise<{locale:string}>}){
 const l=localeOf((await params).locale);
 const items=await published('sectors',l);
 return <main className="container page"><h1>{dict[l].sectors}</h1>
 {items.length===0?<p className="muted">{dict[l].noContent}</p>:
 <div className="cards">{items.map(s=><Link className="card cardBody" href={`/${l}/sectors/${s.slug}`} key={s.id}><h2>{s.title}</h2>{s.summary&&<p>{s.summary}</p>}</Link>)}</div>}
 </main>;
}