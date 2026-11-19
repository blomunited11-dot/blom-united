import {serverDb} from '@/lib/supabase/server';
import {contractingArchitecture} from '@/config/contracting.architecture';
import {contractingDefaultContent} from '@/components/contracting/ContractingExperience';
import {readContractingCopy} from '@/lib/data/contracting';
import {saveContractingCopy} from './actions';
import type {Locale} from '@/lib/i18n/dictionary';

export const dynamic='force-dynamic';
export default async function ContractingAdmin() {
 const db=await serverDb();
 const {data:sector,error:sectorError}=await db.from('sectors').select('id').eq('slug','contracting').maybeSingle();
 if(sectorError||!sector)return <p role="alert">لا يوجد سجل قطاع المقاولات في قاعدة البيانات. لم يتم إنشاء أي بيانات تلقائيًا.</p>;
 const {data:rows,error}=await db.from('content_translations').select('locale,body').eq('entity_type','sector').eq('entity_id',sector.id).in('locale',['ar','en']);
 if(error||!rows)return <p role="alert">تعذر قراءة النصوص: {error?.message}</p>;
 const fields=contractingArchitecture.map(section=>({...section,fields:section.fields.filter(field=>field.kind==='text'&&field.editable)})).filter(section=>section.fields.length);
 return <div dir="rtl" style={{maxWidth:1000}}>
  <h1>معمارية المقاولات — تحرير النصوص</h1>
  <p>الخطوط والأحجام والألوان والتوزيع ثابتة في التصميم. النصوص غير المعدلة تحتفظ بالقيم الأصلية. الصور والمصفوفات ليست ضمن هذه المرحلة.</p>
  {(['ar','en'] as Locale[]).map(locale=>{
   const row=rows.find(x=>x.locale===locale);
   if(!row)return <p role="alert" key={locale}>ترجمة {locale} غير موجودة. الحفظ معطل لهذه اللغة.</p>;
   const copy=readContractingCopy(row.body);
   const defaults=contractingDefaultContent[locale] as unknown as Record<string,unknown>;
   const seen=new Set<string>();
   return <form action={saveContractingCopy} key={locale} style={{border:'1px solid #dce4eb',padding:24,margin:'24px 0',borderRadius:12}}>
    <h2>{locale==='ar'?'النصوص العربية':'English copy'}</h2>
    <input type="hidden" name="locale" value={locale}/>
    {fields.map(section=><fieldset key={section.id} style={{border:'1px solid #e2e8f0',padding:16,margin:'14px 0'}}>
     <legend style={{fontWeight:700}}>{section.labelAr}</legend>
     {section.fields.filter(field=>{if(seen.has(field.key))return false;seen.add(field.key);return true}).map(field=>{
      const defaultText=typeof defaults[field.key]==='string'?defaults[field.key] as string:'';
      return <label key={field.key} style={{display:'grid',gap:6,margin:'12px 0'}}>
       <span>{field.key}</span>
       <textarea dir={locale==='ar'?'rtl':'ltr'} name={field.key} defaultValue={copy[field.key]??defaultText} maxLength={3000} rows={field.key==='intro'||field.key==='capIntro'||field.key==='workIntro'?4:2} required style={{width:'100%',padding:10,border:'1px solid #cbd5e1',borderRadius:8}}/>
      </label>;
     })}
    </fieldset>)}
    <button className="action" type="submit">حفظ النصوص — {locale==='ar'?'العربية':'English'}</button>
   </form>;
  })}
 </div>;
}
