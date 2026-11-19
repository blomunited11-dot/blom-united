import Link from 'next/link';
import {serverDb} from '@/lib/supabase/server';
export const dynamic='force-dynamic';
const paths=[
 ['sectors','إعدادات القطاعات وحالة نشرها'],
 ['projects','المشاريع والعناوين والأوصاف'],
 ['services','الخدمات المنشورة'],
 ['catalog','منتجات قطاع الصناعة'],
 ['media','رفع الصور والوسائط'],
 ['visual','ربط الصور بالمشاريع والخدمات'],
 ['content','الصفحات الداخلية'],
 ['news','الأخبار']
] as const;
export default async function Workspace(){
 const db=await serverDb();
 const {data:sectors,error}=await db.from('sectors').select('id,slug,status,sort_order').order('sort_order').limit(100);
 return <div style={{maxWidth:1100}}>
  <h1>إدارة قطاعات BLOM UNITED</h1>
  <p className="muted">مركز الوصول إلى محتوى القطاعات والصفحات الداخلية. الصفحة الرئيسية للمجموعة خارج نطاق التحرير.</p>
  {error&&<p role="alert">تعذر قراءة القطاعات: {error.message}</p>}
  <div className="adminStats">{(sectors||[]).map(s=><article className="adminStat" key={s.id}><span>{s.slug}</span><strong>{s.status}</strong><p><Link href="/admin/sectors">تعديل بيانات القطاع</Link></p>{s.slug==='contracting'&&<p><Link href="/admin/contracting">تحرير أقسام المقاولات</Link></p>}<p><Link href={`/ar/sectors/${s.slug}`} target="_blank">معاينة الصفحة</Link></p></article>)}</div>
  <h2>أدوات الإدارة المرتبطة</h2>
  <div className="adminShortcuts">{paths.map(([href,title])=><Link key={href} href={`/admin/${href}`}>{title}</Link>)}</div>
  <p className="muted">إدارة الصور والحقول المتقدمة في بعض القطاعات ما زالت تتطلب استكمال الربط مع المكونات المرئية. لا يتم الادعاء بأنها قابلة للتحرير حتى يرتبط عرضها بالبيانات فعليًا.</p>
 </div>;
}
