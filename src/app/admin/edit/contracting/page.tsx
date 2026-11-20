import Link from 'next/link';
import {redirect} from 'next/navigation';
import {serverDb} from '@/lib/supabase/server';
import ContractingExperience from '@/components/contracting/ContractingExperience';
import ContractingInnerExperience from '@/components/contracting/ContractingInnerExperience';
import {contractingPages,type ContractingPageSlug} from '@/config/contracting.pages';
import {getContractingDraft,getContractingHeroImage,mergeContractingCopy,readContractingCopy} from '@/lib/data/contracting';
import {published} from '@/lib/data/site';
import {publishContractingDraft,saveContractingDraft} from '@/app/admin/contracting/actions';
import type {Locale} from '@/lib/i18n/dictionary';

export const dynamic='force-dynamic';
type Props={searchParams:Promise<{locale?:string;page?:string}>};

const fieldLabels:Record<string,string>={
 title:'عنوان بوابة المقاولات',label:'الشارة التعريفية',lead:'العنوان الرئيسي',intro:'مقدمة البوابة',
 seeProjects:'رابط استكشاف الأعمال',contact:'نص التواصل',photo:'وصف الصورة',pending:'نص الصورة الافتراضية',
 capabilities:'عنوان نطاق الأعمال',capIntro:'مقدمة نطاق الأعمال',domainsTitle:'عنوان القطاعات المستهدفة',
 workTitle:'عنوان الأعمال',workIntro:'مقدمة الأعمال',lifecycle:'عنوان مراحل التنفيذ',
 lifecycleIntro:'مقدمة مراحل التنفيذ',integrated:'عنوان الإدارة المتكاملة',integratedIntro:'مقدمة الإدارة المتكاملة',
 standards:'عنوان الجودة والسلامة',published:'عنوان المشاريع المنشورة',publishedServices:'عنوان الخدمات المنشورة',
 more:'رابط التفاصيل',return:'رابط العودة للقطاعات',end:'النص الختامي',services:'روابط الخدمات الست',
 domains:'القطاعات المستهدفة',steps:'مراحل التنفيذ',integratedItems:'عناصر الإدارة المتكاملة',
 projects:'بطاقات الأعمال (JSON)',standardsItems:'عناصر الجودة والسلامة (JSON)'
};

export default async function ContractingVisualEditor({searchParams}:Props){
 const {locale:requestedLocale,page:requestedPage}=await searchParams;
 const locale:Locale=requestedLocale==='en'?'en':'ar';
 const selectedPage=contractingPages.find(item=>item.slug===requestedPage);
 const page:ContractingPageSlug|'root'=requestedPage==='root'?'root':selectedPage?.slug||'root';
 const draft=await getContractingDraft(locale);
 if(!draft.authorized)redirect('/admin/workspace');

 const db=await serverDb();
 const {data:sector,error:sectorError}=await db.from('sectors').select('id').eq('slug','contracting').maybeSingle();
 if(sectorError||!sector)return <p role="alert">تعذر تحميل قطاع المقاولات.</p>;
 const [{data:rows,error:copyError},{data:media,error:mediaError}]=await Promise.all([
  db.from('content_translations').select('locale,body').eq('entity_type','sector').eq('entity_id',sector.id).in('locale',['ar','en']),
  db.from('media_assets').select('id,public_url,alt_ar,alt_en,sector_id').order('created_at',{ascending:false}).limit(200)
 ]);
 if(copyError||!rows)return <p role="alert">تعذر تحميل المحتوى المنشور.</p>;
 const row=rows.find(item=>item.locale===locale);
 if(!row)return <p role="alert">الترجمة المطلوبة غير موجودة.</p>;
 const liveCopy=readContractingCopy(row.body);
 const copy=mergeContractingCopy(locale,liveCopy,draft.copy);
 const currentMediaId=draft.found?draft.heroMediaId:liveCopy.heroMediaId||null;
 const heroImage=draft.found?draft.heroImage:await getContractingHeroImage(locale);
 const options=(media||[]).filter(item=>item.public_url&&(!item.sector_id||item.sector_id===sector.id));
 const sectorPublished=(await published('sectors',locale)).find(item=>item.slug==='contracting');
 const [services,projects]=await Promise.all([
  sectorPublished?published('services',locale,sectorPublished.id):Promise.resolve([]),
  sectorPublished?published('projects',locale,sectorPublished.id):Promise.resolve([])
 ]);
 const fields=Object.entries(copy).filter(([key])=>key!=='pages');
 const textFields=fields.filter(([,value])=>typeof value==='string');
 const listFields=fields.filter(([,value])=>Array.isArray(value)&&value.every(item=>typeof item==='string'));
 const jsonFields=fields.filter(([,value])=>Array.isArray(value)&&value.some(item=>typeof item!=='string'));
 const pageTitle=page==='root'?(locale==='ar'?'بوابة المقاولات':'Contracting portal'):copy.pages[page].title;
 const previewHref=page==='root'?`/${locale}/sectors/contracting?previewDraft=1`:`/${locale}/sectors/contracting/${page}?previewDraft=1`;
 const editor=<section dir={locale==='ar'?'rtl':'ltr'} style={{maxWidth:1200,margin:'24px auto',padding:24,border:'2px solid #b58b46',borderRadius:14,background:'#fff',color:'#15202b'}}>
  <h1 style={{marginTop:0}}>محرر صفحات المقاولات — {pageTitle}</h1>
  <p>عدّل المحتوى ثم احفظه كمسودة. المعاينة تعرض المسودة، ولا يتغير الموقع العام إلا بعد النشر الصريح.</p>
  <nav aria-label="صفحات المحرر" style={{display:'flex',gap:10,flexWrap:'wrap',margin:'16px 0'}}>
   <Link href={`/admin/edit/contracting?locale=${locale}&page=root`}>بوابة المقاولات</Link>
   {contractingPages.map(item=><Link key={item.slug} href={`/admin/edit/contracting?locale=${locale}&page=${item.slug}`}>{copy.pages[item.slug].title}</Link>)}
  </nav>
  <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20}}>
   <Link href={`/admin/edit/contracting?locale=ar&page=${page}`}>العربية</Link>
   <Link href={`/admin/edit/contracting?locale=en&page=${page}`}>English</Link>
   <Link href="/admin/workspace">العودة لإدارة القطاعات</Link>
   {draft.found&&<Link href={previewHref} target="_blank" rel="noreferrer">معاينة هذه الصفحة بالمسودة</Link>}
  </div>
  <form action={saveContractingDraft} style={{display:'grid',gap:14}}>
   <input type="hidden" name="locale" value={locale}/>
   {mediaError&&<input type="hidden" name="hero_media_id" value={currentMediaId||''}/>}
   {textFields.map(([key,value])=><label key={key} style={{display:'grid',gap:6}}>
    <span>{fieldLabels[key]||key}</span>
    <textarea name={`text:${key}`} defaultValue={String(value)} maxLength={3000} rows={2} required style={{width:'100%',padding:10,border:'1px solid #94a3b8',borderRadius:6}}/>
   </label>)}
   {listFields.map(([key,value])=><label key={key} style={{display:'grid',gap:6}}>
    <span>{fieldLabels[key]||key} — عنصر واحد في كل سطر</span>
    <textarea name={`list:${key}`} defaultValue={(value as string[]).join('\n')} maxLength={12000} rows={Math.min(10,Math.max(3,(value as string[]).length))} required style={{width:'100%',padding:10,border:'1px solid #94a3b8',borderRadius:6}}/>
   </label>)}
   {jsonFields.map(([key,value])=><label key={key} style={{display:'grid',gap:6}}>
    <span>{fieldLabels[key]||key}</span>
    <textarea name={`json:${key}`} defaultValue={JSON.stringify(value,null,2)} maxLength={30000} rows={14} required dir="ltr" style={{width:'100%',padding:10,border:'1px solid #94a3b8',borderRadius:6,fontFamily:'monospace'}}/>
   </label>)}
   <fieldset style={{display:'grid',gap:10,border:'1px solid #cbd5e1',padding:14}}>
    <legend>عناوين ووصف الصفحات الداخلية</legend>
    {contractingPages.map(item=><div key={item.slug} style={{display:'grid',gap:8,gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',padding:'8px 0'}}>
     <label style={{display:'grid',gap:4}}><span>{item.slug} — العنوان</span><input name={`page:${item.slug}:title`} defaultValue={copy.pages[item.slug].title} maxLength={3000} required/></label>
     <label style={{display:'grid',gap:4}}><span>{item.slug} — الوصف</span><textarea name={`page:${item.slug}:description`} defaultValue={copy.pages[item.slug].description} maxLength={3000} rows={2} required/></label>
    </div>)}
   </fieldset>
   <label style={{display:'grid',gap:6}}>
    <span>صورة واجهة المقاولات — تحفظ ضمن المسودة</span>
    <select name={mediaError?'hero_media_id_disabled':'hero_media_id'} defaultValue={currentMediaId||''} disabled={!!mediaError} style={{padding:10}}>
     <option value="">بدون صورة</option>
     {currentMediaId&&!options.some(item=>item.id===currentMediaId)&&<option value={currentMediaId}>الصورة الحالية</option>}
     {options.map(item=><option key={item.id} value={item.id}>{(locale==='ar'?item.alt_ar:item.alt_en)||item.id}</option>)}
    </select>
    {mediaError&&<span role="alert">تعذر تحميل مكتبة الوسائط: {mediaError.message}</span>}
    <Link href="/admin/media">رفع صورة جديدة إلى المكتبة</Link>
   </label>
   <button type="submit" style={{padding:13,background:'#173e4f',color:'white',borderRadius:8,cursor:'pointer'}}>حفظ المسودة — {locale==='ar'?'العربية':'English'}</button>
  </form>
  {draft.found?<form action={publishContractingDraft} style={{marginTop:16}}>
   <input type="hidden" name="locale" value={locale}/>
   <button type="submit" style={{padding:13,background:'#146c43',color:'white',borderRadius:8,cursor:'pointer'}}>نشر المسودة المحفوظة لهذه اللغة</button>
   <p>آخر حفظ للمسودة: {draft.updatedAt}</p>
  </form>:<p role="status">لا توجد مسودة محفوظة لهذه اللغة بعد.</p>}
 </section>;

 return <div>
  {editor}
  {page==='root'
   ?<ContractingExperience locale={locale} services={services} projects={projects} copy={copy} heroImage={heroImage}/>
   :<ContractingInnerExperience locale={locale} page={page} copy={copy} services={services} projects={projects}/>}
 </div>;
}
