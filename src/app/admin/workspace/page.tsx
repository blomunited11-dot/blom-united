import Link from 'next/link';
import {serverDb} from '@/lib/supabase/server';
import {contractingPages} from '@/config/contracting.pages';
export const dynamic='force-dynamic';
type Props={searchParams:Promise<{sector?:string}>};
const names:Record<string,string>={contracting:'المقاولات والتطوير العقاري',industry:'الصناعة والأخشاب',hospitality:'الضيافة',administrative:'الخدمات الإدارية',services:'الخدمات الإدارية'};
export default async function Workspace({searchParams}:Props){
 const {sector:requested}=await searchParams;
 const db=await serverDb();
 const {data:sectors,error}=await db.from('sectors').select('id,slug,status,sort_order').order('sort_order').limit(100);
 const list=sectors||[];
 const selected=list.find(s=>s.slug===requested)||null;
 return <div style={{maxWidth:1200}}>
  <h1>لوحة إدارة القطاعات</h1>
  <p className="muted">الخطوة الأولى: اختر القطاع. الصفحة الرئيسية للمجموعة مستثناة تمامًا من التحرير.</p>
  {error&&<p role="alert">{error.message}</p>}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14,margin:'25px 0'}}>
   {list.map(s=><Link key={s.id} href={`/admin/workspace?sector=${encodeURIComponent(s.slug)}`} style={{display:'grid',gap:10,border:selected?.id===s.id?'2px solid #285a78':'1px solid #d7dee7',background:selected?.id===s.id?'#eaf3f8':'white',borderRadius:14,padding:24}}>
    <strong>{names[s.slug]||s.slug}</strong><small>{s.status==='published'?'منشور':s.status}</small>
    <span>فتح معمارية القطاع ←</span>
   </Link>)}
  </div>
  {selected?<section style={{border:'1px solid #d7dee7',borderRadius:14,padding:24,background:'white'}}>
   <p><Link href="/admin/workspace">القطاعات</Link> / {names[selected.slug]||selected.slug}</p>
   <h2>معمارية {names[selected.slug]||selected.slug}</h2>
   {selected.slug==='contracting'?<div>
    <p><Link href="/admin/edit/contracting">فتح محرر صفحات المقاولات — مسودات ومعاينة ونشر</Link></p>
    <p>يتضمن المحرر البوابة الرئيسية والصفحات الداخلية الإحدى عشرة. اختر الصفحة من المحرر لتعديل محتواها ومعاينة شكلها الفعلي.</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
     {contractingPages.map((page,index)=><Link key={page.slug} href={`/admin/edit/contracting?page=${page.slug}`} style={{border:'1px solid #e0e6ed',padding:18,borderRadius:10}}>{String(index+2).padStart(2,'0')} — {page.ar}</Link>)}
    </div>
    <h3>المشاريع والصور</h3>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
     <Link href="/admin/projects" style={{border:'1px solid #e0e6ed',padding:18,borderRadius:10}}>إدارة المشاريع وحالات النشر</Link>
     <Link href="/admin/edit/contracting?page=root#project-media" style={{border:'1px solid #e0e6ed',padding:18,borderRadius:10}}>مسودات صور بطاقات المشاريع</Link>
     <Link href="/admin/media" style={{border:'1px solid #e0e6ed',padding:18,borderRadius:10}}>مكتبة الوسائط</Link>
    </div>
   </div>:<div>
    <p>هذا القطاع يعرض حاليًا البيانات المنشورة فقط. محرره لم يُبنَ بعد؛ ستظهر أدواته هنا بعد تجهيز صفحاته بدل عرض أزرار عامة لا تخص هذا القطاع.</p>
   </div>}
   <p style={{marginTop:24}}><Link href={`/ar/sectors/${selected.slug}`} target="_blank">معاينة القطاع في الموقع</Link></p>
  </section>:<p>اختر أحد القطاعات أعلاه لعرض أدواته ومعماريته.</p>}
 </div>;
}
