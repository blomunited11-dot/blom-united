import Link from 'next/link';
import {serverDb} from '@/lib/supabase/server';
export default async function Dashboard(){
 const db=await serverDb();
 const tables=[['sectors','القطاعات','sectors'],['projects','المشاريع','projects'],['services','الخدمات','sectors'],['news','الأخبار','news'],['catalog_products','المنتجات','catalog'],['media_assets','الصور والوسائط','media']] as const;
 const totals=await Promise.all(tables.map(async ([table,label,href])=>{const{count,error}=await db.from(table).select('*',{count:'exact',head:true});return{table,label,href,count:count??0,error:error?.message}}));
 const [{count:publishedProjects},{count:publishedServices},{count:linkedMedia},{count:unlinkedMedia}]=await Promise.all([
 db.from('projects').select('*',{count:'exact',head:true}).eq('status','published'),
 db.from('services').select('*',{count:'exact',head:true}).eq('status','published'),
 db.from('entity_media').select('*',{count:'exact',head:true}),
 db.from('media_assets').select('*',{count:'exact',head:true})
 ]);
 return <div className="adminDashboard"><span className="mediaEyebrow">BLOM UNITED / CONTROL CENTER</span><h1>لوحة إدارة المحتوى</h1><p className="muted">مؤشرات مباشرة من قاعدة البيانات، لتسهيل متابعة جاهزية المحتوى قبل النشر.</p>
 <div className="adminStats">{totals.map(x=><Link className="adminStat" href={`/admin/${x.href}`} key={x.table}><span>{x.label}</span><strong>{x.error?'—':x.count}</strong><small>{x.error?'تعذر تحميل المؤشر':'إدارة المحتوى ↗'}</small></Link>)}</div>
 <section className="adminDashboardSection"><h2>حالة النشر والربط</h2><div className="adminHealth"><div><span>المشاريع المنشورة</span><strong>{publishedProjects??'—'}</strong></div><div><span>الخدمات المنشورة</span><strong>{publishedServices??'—'}</strong></div><div><span>روابط الصور بالمحتوى</span><strong>{linkedMedia??'—'}</strong></div><div><span>إجمالي ملفات الوسائط</span><strong>{unlinkedMedia??'—'}</strong></div></div><p className="muted">عدد الروابط ليس عدد الصور الفريدة؛ قد ترتبط الصورة بأكثر من عنصر. هذه مؤشرات محتوى وليست إحصاءات زيارات.</p></section>
 <section className="adminDashboardSection"><h2>مسارات العمل</h2><div className="adminShortcuts"><Link href="/admin/media">إعداد الصور وربطها بالمشاريع ↗</Link><Link href="/admin/projects">إدارة المشاريع وحالات النشر ↗</Link><Link href="/admin/sectors">إدارة القطاعات ↗</Link></div></section>
 </div>;
}
