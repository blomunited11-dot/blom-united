import Link from 'next/link';
import {serverDb} from '@/lib/supabase/server';
import {published} from '@/lib/data/site';
import {contractingArchitecture} from '@/config/contracting.architecture';
import {contractingDefaultContent} from '@/components/contracting/ContractingExperience';
import ContractingExperience from '@/components/contracting/ContractingExperience';
import {readContractingCopy,getContractingHeroImage} from '@/lib/data/contracting';
import {saveContractingCopy,saveContractingHeroImage} from '@/app/admin/contracting/actions';
import type {Locale} from '@/lib/i18n/dictionary';

export const dynamic='force-dynamic';
type Props={searchParams:Promise<{locale?:string}>};

/** Admin-only visual editing pilot: the same public renderer, never a copied site. */
export default async function ContractingVisualEditor({searchParams}:Props){
 const {locale:requested}=await searchParams;
 const locale:Locale=requested==='en'?'en':'ar';
 const db=await serverDb();
 const {data:sector,error:sectorError}=await db.from('sectors').select('id').eq('slug','contracting').maybeSingle();
 if(sectorError||!sector)return <p role="alert">قطاع المقاولات غير متوفر.</p>;
 const [{data:rows,error:copyError},{data:media,error:mediaError},heroImage]=await Promise.all([
  db.from('content_translations').select('locale,body').eq('entity_type','sector').eq('entity_id',sector.id).in('locale',['ar','en']),
  db.from('media_assets').select('id,public_url,alt_ar,alt_en,sector_id').order('created_at',{ascending:false}).limit(200),
  getContractingHeroImage(locale)
 ]);
 if(copyError||!rows)return <p role="alert">تعذر تحميل المحتوى.</p>;
 const row=rows.find(r=>r.locale===locale);
 if(!row)return <p role="alert">الترجمة المطلوبة غير موجودة.</p>;
 const copy=readContractingCopy(row.body);
 const defaults=contractingDefaultContent[locale] as unknown as Record<string,unknown>;
 const current=rows.find(r=>r.locale==='ar')?.body;
 const currentContracting=current&&typeof current==='object'&&!Array.isArray(current)?(current as Record<string,unknown>).contracting:null;
 const selectedMedia=currentContracting&&typeof currentContracting==='object'&&!Array.isArray(currentContracting)?String((currentContracting as Record<string,unknown>).heroMediaId||''):'';
 const options=(media||[]).filter(m=>m.public_url&&(!m.sector_id||m.sector_id===sector.id));
 const sectorPublished=(await published('sectors',locale)).find(s=>s.slug==='contracting');
 const [services,projects]=await Promise.all([
  sectorPublished?published('services',locale,sectorPublished.id):Promise.resolve([]),
  sectorPublished?published('projects',locale,sectorPublished.id):Promise.resolve([])
 ]);
 const controls=<div dir="rtl" style={{background:'#fff',color:'#15202b',border:'2px solid #b58b46',borderRadius:12,padding:20,margin:'20px auto',maxWidth:1200}}>
  <h2 style={{marginTop:0}}>تحرير مباشر — بوابة المقاولات</h2>
  <p>أنت تشاهد مكونات الصفحة الأصلية. افتح القسم المطلوب لتعديل النصوص أو صورة الواجهة. الحفظ هنا يستخدم إجراءات Supabase الحالية ويؤثر في المحتوى المنشور؛ نظام المسودات لم يُنفّذ بعد.</p>
  <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
   <Link href="/admin/workspace">العودة لإدارة القطاعات</Link>
   <Link href="/admin/edit/contracting?locale=ar">العربية</Link>
   <Link href="/admin/edit/contracting?locale=en">English</Link>
   <Link href={`/${locale}/sectors/contracting`} target="_blank">فتح صفحة الزوار</Link>
  </div>
  <div style={{display:'grid',gap:10}}>
   {contractingArchitecture.map(section=>{
    const fields=[...new Map(section.fields.filter(f=>f.kind==='text'&&f.editable).map(f=>[f.key,f])).values()];
    return <details key={section.id} id={section.id} style={{border:'1px solid #cbd5e1',borderRadius:8,padding:12}}>
     <summary style={{cursor:'pointer',fontWeight:700}}>{section.labelAr} — {fields.length?'تحرير النصوص':'عرض فقط'}</summary>
     {fields.length>0&&<form action={saveContractingCopy} style={{display:'grid',gap:12,marginTop:14}}>
      <input type="hidden" name="locale" value={locale}/>
      <input type="hidden" name="section" value={section.id}/>
      {fields.map(field=><label key={field.key} style={{display:'grid',gap:5}}>
       <span>{field.key}</span>
       <textarea name={field.key} rows={2} maxLength={3000} required dir={locale==='ar'?'rtl':'ltr'} defaultValue={copy[field.key]??(typeof defaults[field.key]==='string'?defaults[field.key] as string:'')} style={{width:'100%',padding:10,border:'1px solid #94a3b8',borderRadius:6}}/>
      </label>)}
      <button type="submit" style={{padding:12,background:'#173e4f',color:'white',borderRadius:8,cursor:'pointer'}}>حفظ نصوص القسم</button>
     </form>}
     {section.id==='hero'&&<form action={saveContractingHeroImage} style={{display:'grid',gap:10,marginTop:16}}>
      <label>صورة الواجهة من مكتبة الوسائط
       <select name="media_id" defaultValue={selectedMedia} style={{display:'block',width:'100%',padding:10}}>
        <option value="">بدون صورة</option>
        {options.map(m=><option key={m.id} value={m.id}>{(locale==='ar'?m.alt_ar:m.alt_en)||m.id}</option>)}
       </select>
      </label>
      <Link href="/admin/media">رفع صورة جديدة إلى المكتبة</Link>
      <button type="submit" disabled={!!mediaError} style={{padding:12,background:'#173e4f',color:'white',borderRadius:8,cursor:'pointer'}}>حفظ صورة الواجهة</button>
      {mediaError&&<p role="alert">{mediaError.message}</p>}
     </form>}
    </details>;
   })}
  </div>
 </div>;
 return <ContractingExperience locale={locale} services={services} projects={projects} copy={copy} heroImage={heroImage} editorControls={controls}/>;
}
