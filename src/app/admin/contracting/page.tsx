import Link from 'next/link';
import {serverDb} from '@/lib/supabase/server';
import {contractingArchitecture} from '@/config/contracting.architecture';
import {contractingPages} from '@/config/contracting.pages';
import {contractingDefaultContent} from '@/components/contracting/ContractingExperience';
import {readContractingCopy} from '@/lib/data/contracting';
import {saveContractingCopy,saveContractingHeroImage} from './actions';
import type {Locale} from '@/lib/i18n/dictionary';

export const dynamic='force-dynamic';
type Params={searchParams:Promise<{section?:string;mode?:string}>};
export default async function ContractingAdmin({searchParams}:Params){
 const {section:requested,mode:requestedMode}=await searchParams;
 const section=contractingArchitecture.find(x=>x.id===requested)||contractingArchitecture[0];
 const requestedImages=requestedMode==='images';
 const mode=requestedImages&&section.id==='hero'?'images':'texts';
 const db=await serverDb();
 const {data:sector,error:sectorError}=await db.from('sectors').select('id').eq('slug','contracting').maybeSingle();
 if(sectorError||!sector)return <p role="alert">سجل قطاع المقاولات غير موجود؛ لم تتغير البيانات.</p>;
 const [{data:rows,error},{data:media,error:mediaError}]=await Promise.all([
  db.from('content_translations').select('locale,body').eq('entity_type','sector').eq('entity_id',sector.id).in('locale',['ar','en']),
  db.from('media_assets').select('id,public_url,alt_ar,sector_id').order('created_at',{ascending:false}).limit(200)
 ]);
 if(error||!rows)return <p role="alert">تعذر قراءة النصوص: {error?.message}</p>;
 const currentBody=rows.find(x=>x.locale==='ar')?.body;
 const currentCopy=currentBody&&typeof currentBody==='object'&&!Array.isArray(currentBody)?(currentBody as Record<string,unknown>).contracting:null;
 const currentMediaId=currentCopy&&typeof currentCopy==='object'&&!Array.isArray(currentCopy)?String((currentCopy as Record<string,unknown>).heroMediaId||''):'';
 const options=(media||[]).filter(x=>x.public_url&&(!x.sector_id||x.sector_id===sector.id));
 const fields=section.fields.filter(x=>x.kind==='text'&&x.editable);
 const path=(id:string,m:string)=>`/admin/contracting?section=${id}&mode=${m}`;
 return <div dir="rtl" style={{maxWidth:1200}}>
  <p><Link href="/admin/workspace">القطاعات</Link> / المقاولات والتطوير العقاري</p>
  <h1>معمارية قطاع المقاولات — 12 صفحة</h1>
  <section style={{border:'1px solid #d7dee7',borderRadius:12,padding:16,margin:'20px 0'}}><h2>صفحات القطاع المعتمدة (12)</h2><p>البوابة الرئيسية + 11 صفحة داخلية. الصفحات الداخلية تستخدم محتوى القطاع المنشور، وتحتاج صور الخدمات إلى اعتماد وربط مستقل.</p><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Link href='/ar/sectors/contracting' target='_blank'>01 — بوابة المقاولات</Link>{contractingPages.map((p,i)=><Link key={p.slug} href={`/ar/sectors/contracting/${p.slug}`} target='_blank'>{String(i+2).padStart(2,'0')} — {p.ar}</Link>)}</div></section>
  <p className="muted">اختر القسم الحقيقي من الصفحة ثم النصوص أو الصور. يحفظ كل قسم وحده دون استبدال بيانات الأقسام الأخرى.</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,margin:'24px 0'}}>
   {contractingArchitecture.map(s=><Link key={s.id} href={path(s.id,mode)} style={{display:'block',border:s.id===section.id?'2px solid #285a78':'1px solid #ccd5df',borderRadius:12,padding:16,background:s.id===section.id?'#e9f2f8':'white'}}><strong>{s.labelAr}</strong><small style={{display:'block',marginTop:6}}>{s.fields.length} عناصر معرفة</small></Link>)}
  </div>
  <section style={{background:'white',border:'1px solid #d7dee7',borderRadius:14,padding:24}}>
   <h2>{section.labelAr}</h2>
   {requestedImages&&section.id!=='hero'&&<p role="status">تحرير الصور متاح حاليًا لقسم الواجهة فقط.</p>}
   <nav style={{display:'flex',gap:12,margin:'15px 0 25px'}}>
    <Link href={path(section.id,'texts')} style={{padding:12,borderBottom:mode==='texts'?'3px solid #285a78':'1px solid #ddd'}}>النصوص</Link>
    {section.id==='hero'?<Link href={path(section.id,'images')} style={{padding:12,borderBottom:mode==='images'?'3px solid #285a78':'1px solid #ddd'}}>الصور</Link>:<span aria-disabled="true" style={{padding:12,color:'#64748b'}}>الصور غير متاحة</span>}
    <Link href="/ar/sectors/contracting" target="_blank" style={{padding:12}}>معاينة القطاع</Link>
   </nav>
   {mode==='texts'?fields.length===0?<p>لا توجد نصوص منفردة قابلة للتحرير في هذا القسم حاليًا.</p>:
    (['ar','en'] as Locale[]).map(locale=>{
     const row=rows.find(x=>x.locale===locale);
     if(!row)return <p role="alert" key={locale}>ترجمة {locale} غير موجودة؛ الحفظ معطل.</p>;
     const copy=readContractingCopy(row.body);
     const defaults=contractingDefaultContent[locale] as unknown as Record<string,unknown>;
     return <form action={saveContractingCopy} key={locale} style={{border:'1px solid #e2e8f0',padding:20,margin:'16px 0',borderRadius:12}}>
      <h3>{locale==='ar'?'العربية':'English'}</h3>
      <input type="hidden" name="locale" value={locale}/>
      <input type="hidden" name="section" value={section.id}/>
      {fields.filter((field,index)=>fields.findIndex(x=>x.key===field.key)===index).map(field=><label key={field.key} style={{display:'grid',gap:7,margin:'12px 0'}}>
       <span>{field.key}</span><textarea name={field.key} dir={locale==='ar'?'rtl':'ltr'} defaultValue={copy[field.key]??(typeof defaults[field.key]==='string'?defaults[field.key] as string:'')} maxLength={3000} rows={3} required style={{width:'100%',padding:12,border:'1px solid #cbd5e1',borderRadius:8}}/>
      </label>)}
      <button className="action" type="submit">حفظ نصوص {section.labelAr} — {locale==='ar'?'العربية':'English'}</button>
     </form>;
    }):
    section.id==='hero'?<div>
     <p>اختر صورة الواجهة من مكتبة الوسائط الحالية. لا تُعدل الصورة الرئيسية للمجموعة.</p>
     {mediaError&&<p role="alert">{mediaError.message}</p>}
     <form action={saveContractingHeroImage} style={{display:'grid',gap:16,maxWidth:700}}>
      <label className="field">صورة واجهة المقاولات
       <select name="media_id" defaultValue={currentMediaId}>
        <option value="">بدون صورة — إظهار الموضع الافتراضي</option>
        {options.map(x=><option key={x.id} value={x.id}>{x.alt_ar||x.id}</option>)}
       </select>
      </label>
      {currentMediaId&&options.find(x=>x.id===currentMediaId)?.public_url&&<img src={options.find(x=>x.id===currentMediaId)!.public_url!} alt="الصورة الحالية" style={{maxWidth:'100%',maxHeight:260,objectFit:'contain'}}/>}
      <button className="action" type="submit" disabled={!!mediaError}>حفظ صورة الواجهة</button>
     </form>
     <p><Link href="/admin/media">رفع صورة جديدة إلى مكتبة الوسائط</Link></p>
    </div>:<div><p>هذا القسم يستخدم مواضع مرئية أو قوائم ثابتة لم تُربط بعد بمحرر الصور؛ لا توجد أداة حفظ وهمية.</p><Link href="/admin/visual">فتح محرر روابط صور المشاريع والخدمات</Link></div>}
  </section>
 </div>;
}
