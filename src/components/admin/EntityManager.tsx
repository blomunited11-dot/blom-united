import Link from 'next/link';
import {serverDb} from '@/lib/supabase/server';
import {EntryEditor} from './EntryEditor';
import {updateManagedEntry} from '@/app/admin/manage/actions';

type Table='sectors'|'services'|'projects'|'news'|'pages'|'catalog_categories'|'catalog_products';
const entityType:Record<Table,string>={sectors:'sector',services:'service',projects:'project',news:'news',pages:'page',catalog_categories:'category',catalog_products:'product'};
const protectedSlugs=new Set(['home','homepage','index','landing','main']);
const statusOptions=[['draft','مسودة'],['review','للمراجعة'],['published','منشور'],['archived','مؤرشف']];
export async function EntityManager({table,title}:{table:Table;title:string}){
 const db=await serverDb();
 const [entries,sectors,categories]=await Promise.all([
  db.from(table).select('*').order('slug').limit(150),
  db.from('sectors').select('id,slug').order('slug').limit(100),
  db.from('catalog_categories').select('id,slug,sector_id').order('slug').limit(200)
 ]);
 const items=(entries.data||[]).filter(x=>!(table==='pages'&&protectedSlugs.has(x.slug)));
 const ids=items.map(x=>x.id);
 const translations=ids.length?await db.from('content_translations').select('entity_id,locale,title,summary').eq('entity_type',entityType[table]).in('entity_id',ids).in('locale',['ar','en']):{data:[],error:null};
 return <div style={{maxWidth:1080}}>
  <h1>{title}</h1>
  <p className="muted">إضافة وتحرير المحتوى العربي والإنجليزي وحالة النشر والارتباط بالقطاع. تبقى الصور والمحتويات التفصيلية المحفوظة دون تغيير. الصفحة الرئيسية مستثناة.</p>
  {entries.error&&<p role="alert">تعذر تحميل السجلات: {entries.error.message}</p>}
  {translations.error&&<p role="alert">تعذر تحميل الترجمات: {translations.error.message}</p>}
  {sectors.error&&<p role="alert">تعذر تحميل القطاعات: {sectors.error.message}</p>}
  <section className="adminDashboardSection">
   <h2>العناصر الحالية ({items.length})</h2>
   {!items.length&&<p>لا توجد عناصر في النطاق المعروض.</p>}
   {items.map(item=>{
    const ar=translations.data?.find(x=>x.entity_id===item.id&&x.locale==='ar');
    const en=translations.data?.find(x=>x.entity_id===item.id&&x.locale==='en');
    return <details key={item.id} style={{border:'1px solid #d7dee7',borderRadius:12,padding:16,margin:'12px 0'}}>
     <summary style={{cursor:'pointer',fontWeight:700}}>{ar?.title||item.slug} — {item.status} <small>({item.slug})</small></summary>
     {(!ar||!en)?<p role="alert">الترجمة العربية أو الإنجليزية مفقودة. الحفظ معطل لحماية البيانات؛ يجب إصلاح السجل أولًا.</p>:
     <form action={updateManagedEntry} style={{display:'grid',gap:12,paddingTop:16}}>
      <input type="hidden" name="table" value={table}/><input type="hidden" name="id" value={item.id}/>
      <label className="field">الرابط المختصر<input name="slug" defaultValue={item.slug} pattern="[a-z0-9-]{2,80}" required/></label>
      <label className="field">الحالة<select name="status" defaultValue={item.status}>{statusOptions.map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
      {table!=='sectors'&&<label className="field">القطاع<select name="sector_id" defaultValue={item.sector_id||''} required={['services','projects','catalog_categories','catalog_products'].includes(table)}><option value="">عام / بلا قطاع</option>{(sectors.data||[]).map(s=><option value={s.id} key={s.id}>{s.slug}</option>)}</select></label>}
      {['sectors','services'].includes(table)&&<label className="field">الترتيب<input type="number" name="sort_order" min="0" max="9999" defaultValue={item.sort_order??0} required/></label>}
      {table==='catalog_products'&&<label className="field">التصنيف<select name="category_id" defaultValue={item.category_id||''}><option value="">دون تصنيف</option>{(categories.data||[]).filter(c=>c.sector_id===item.sector_id).map(c=><option value={c.id} key={c.id}>{c.slug}</option>)}</select><small>عند تغيير القطاع، اختر تصنيفًا تابعًا للقطاع الجديد أو أزل التصنيف.</small></label>}
      <fieldset style={{padding:12,border:'1px solid #ddd'}}><legend>العربية</legend><label className="field">العنوان<input name="title_ar" maxLength={250} defaultValue={ar.title} required/></label><label className="field">الوصف<textarea name="summary_ar" maxLength={3000} defaultValue={ar.summary||''}/></label></fieldset>
      <fieldset style={{padding:12,border:'1px solid #ddd'}}><legend>English</legend><label className="field">Title<input name="title_en" maxLength={250} defaultValue={en.title} required dir="ltr"/></label><label className="field">Summary<textarea name="summary_en" maxLength={3000} defaultValue={en.summary||''} dir="ltr"/></label></fieldset>
      <button className="action" type="submit">حفظ التعديلات</button>
     </form>}
     {table==='sectors'&&item.slug==='contracting'&&<p><Link href="/admin/contracting">تحرير أقسام نصوص المقاولات التفصيلية</Link></p>}
    </details>;
   })}
  </section>
  <section className="adminDashboardSection"><h2>إضافة عنصر جديد</h2><EntryEditor table={table} sectors={sectors.data||[]}/></section>
 </div>;
}
