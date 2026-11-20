'use client';

import Link from 'next/link';
import {useState} from 'react';
import {useFormStatus} from 'react-dom';
import type {Entry} from '@/lib/data/site';
import type {Locale} from '@/lib/i18n/dictionary';
import {mergeContractingCopy,type ContractingContent} from '@/lib/data/contracting-copy';
import {contractingPages,type ContractingPageSlug} from '@/config/contracting.pages';
import {publishContractingDraft,saveContractingDraft} from '@/app/admin/contracting/actions';
import ContractingExperience from '@/components/contracting/ContractingExperience';
import ContractingInnerExperience from '@/components/contracting/ContractingInnerExperience';
import type {ContractingProjectMediaDrafts} from '@/lib/data/contracting-project-media';
import styles from './ContractingVisualEditor.module.css';

type MediaOption={id:string;public_url:string;alt_ar:string|null;alt_en:string|null};
type PageSlug=ContractingPageSlug|'root';

type Props={
 locale:Locale;
 page:PageSlug;
 copy:ContractingContent;
 mediaId:string|null;
 heroImage:string|null;
 mediaOptions:MediaOption[];
 mediaError:string|null;
 projectMediaDrafts:ContractingProjectMediaDrafts;
 services:Entry[];
 projects:Entry[];
 draftFound:boolean;
 updatedAt:string|null;
 previewHref:string;
};

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

function isStringList(value:unknown):value is string[]{
 return Array.isArray(value)&&value.every(item=>typeof item==='string');
}

function SaveButton({disabled}:{disabled:boolean}){
 const {pending}=useFormStatus();
 return <button className={styles.saveButton} type="submit" disabled={disabled||pending}>{pending?'جاري الحفظ…':'حفظ التعديلات كمسودة'}</button>;
}

function PublishButton({disabled}:{disabled:boolean}){
 const {pending}=useFormStatus();
 return <button className={styles.publishButton} type="submit" disabled={disabled||pending}>{pending?'جاري النشر…':'نشر مسودة المحتوى وصور بطاقات الأعمال'}</button>;
}

export default function ContractingVisualEditor({
 locale,page,copy:initialCopy,mediaId,heroImage:initialHeroImage,mediaOptions,mediaError,
 projectMediaDrafts,services,projects,draftFound,updatedAt,previewHref
}:Props){
 const [copy,setCopy]=useState(initialCopy);
 const [selectedMediaId,setSelectedMediaId]=useState(mediaId||'');
 const [heroImage,setHeroImage]=useState(initialHeroImage);
 const [projectMediaSelections,setProjectMediaSelections]=useState<Record<string,string>>(()=>(
  Object.fromEntries(Object.entries(projectMediaDrafts).map(([id,draft])=>[id,draft.mediaId]))
 ));
 const [isDirty,setIsDirty]=useState(false);
 const [jsonValues,setJsonValues]=useState<Record<string,string>>(()=>{
  return Object.fromEntries(Object.entries(initialCopy).filter(([,value])=>
   Array.isArray(value)&&value.some(item=>typeof item!=='string')
  ).map(([key,value])=>[key,JSON.stringify(value,null,2)]));
 });
 const [jsonErrors,setJsonErrors]=useState<Record<string,string>>({});
 const entries=Object.entries(copy) as [string,unknown][];
 const textFields=entries.filter(([,value])=>typeof value==='string');
 const listFields=entries.filter(([,value])=>isStringList(value));
 const jsonFields=entries.filter(([,value])=>Array.isArray(value)&&value.some(item=>typeof item!=='string'));
 const pageTitle=page==='root'?(locale==='ar'?'بوابة المقاولات':'Contracting portal'):copy.pages[page].title;
  const previewProjects=projects.map(project=>{
   const selection=projectMediaSelections[project.id];
   if(!selection)return project;
   const media=mediaOptions.find(item=>item.id===selection);
   return media?{...project,cover:media.public_url}:project;
  });
 const visibleMediaOptions=[...mediaOptions];
 if(selectedMediaId&&!visibleMediaOptions.some(item=>item.id===selectedMediaId)){
  visibleMediaOptions.unshift({
   id:selectedMediaId,
   public_url:initialHeroImage||'',
   alt_ar:'الصورة الحالية',
   alt_en:'Current image'
  });
 }

 function updateField(key:string,value:unknown){
  setCopy(current=>({...current,[key]:value}) as ContractingContent);
  setIsDirty(true);
 }

 function updatePageField(slug:ContractingPageSlug,field:'title'|'description',value:string){
  setCopy(current=>({
   ...current,
   pages:{
    ...current.pages,
    [slug]:{...current.pages[slug],[field]:value}
   }
  }));
  setIsDirty(true);
 }

 function updateJsonField(key:string,value:string){
  setJsonValues(current=>({...current,[key]:value}));
  try{
   const parsed:unknown=JSON.parse(value);
   updateField(key,parsed);
   setJsonErrors(current=>{const next={...current};delete next[key];return next;});
  }catch{
   setJsonErrors(current=>({...current,[key]:'تحقق من صيغة JSON قبل المعاينة أو الحفظ.'}));
   setIsDirty(true);
  }
 }

 function chooseMedia(id:string,url:string|null){
  setSelectedMediaId(id);
  setHeroImage(url);
  setIsDirty(true);
 }

 const previewCopy=mergeContractingCopy(locale,copy);
 const portfolioImages=Object.fromEntries(previewCopy.projects.flatMap(project=>{
  const image=mediaOptions.find(item=>item.id===project.mediaId)?.public_url;
  return image?[[project.key,image]]:[];
 }));

 function updatePortfolioMedia(projectKey:string,mediaId:string){
  const nextProjects=copy.projects.map(project=>project.key===projectKey
   ?{...project,mediaId:mediaId||null}
   :project);
  setCopy(current=>({...current,projects:nextProjects}));
  setJsonValues(current=>({...current,projects:JSON.stringify(nextProjects,null,2)}));
  setJsonErrors(current=>{const next={...current};delete next.projects;return next;});
  setIsDirty(true);
 }

 return <div className={styles.page} dir={locale==='ar'?'rtl':'ltr'}>
  <div className={styles.columns}>
   <section className={styles.editorPanel} aria-label="أدوات التحرير">
    <header className={styles.editorHeader}>
     <p className={styles.eyebrow}>BLOM UNITED / CONTENT STUDIO</p>
     <h1>محرر صفحات المقاولات — {pageTitle}</h1>
     <p>عدّل الحقول وشاهد أثرها مباشرة في المعاينة. الحفظ ينشئ مسودة فقط؛ النشر منفصل.</p>
    </header>
    <nav className={styles.pageNav} aria-label="صفحات المحرر">
      {contractingPages.map(item=><Link key={item.slug} href={`/admin/edit/contracting?locale=${locale}&page=${item.slug}`}>{copy.pages[item.slug].title}</Link>)}
    </nav>
    <div className={styles.utilityLinks}>
     <Link href={`/admin/edit/contracting?locale=ar&page=${page}`}>العربية</Link>
     <Link href={`/admin/edit/contracting?locale=en&page=${page}`}>English</Link>
     <Link href="/admin/workspace?sector=contracting">إدارة القطاع</Link>
     {draftFound&&<Link href={previewHref} target="_blank" rel="noreferrer">فتح آخر مسودة محفوظة</Link>}
    </div>

    <form action={saveContractingDraft} className={styles.form}>
     <input type="hidden" name="locale" value={locale}/>
     {mediaError&&<input type="hidden" name="hero_media_id" value={selectedMediaId}/>}
     <fieldset className={styles.mediaFieldset}>
      <legend>صورة واجهة المقاولات</legend>
      <p className={styles.helpText}>اختر صورة من مكتبة الوسائط. ستظهر فورًا في المعاينة، وتُحفظ ضمن المسودة.</p>
      {mediaError?<p className={styles.error} role="alert">تعذر تحميل مكتبة الوسائط: {mediaError}</p>:<>
       <div className={styles.mediaGrid}>
        <label className={styles.mediaChoice}>
         <input type="radio" name="hero_media_id" value="" checked={!selectedMediaId} onChange={()=>chooseMedia('',null)}/>
         <span className={styles.noImage}>بدون صورة</span>
         <span>إزالة الصورة</span>
        </label>
        {visibleMediaOptions.map(item=><label className={styles.mediaChoice} key={item.id}>
         <input type="radio" name="hero_media_id" value={item.id} checked={selectedMediaId===item.id} onChange={()=>chooseMedia(item.id,item.public_url||null)}/>
         {item.public_url?<img src={item.public_url} alt={locale==='ar'?item.alt_ar||'صورة من المكتبة':item.alt_en||'Library image'} loading="lazy"/>:<span className={styles.noImage}>الصورة غير متاحة</span>}
         <span>{(locale==='ar'?item.alt_ar:item.alt_en)||'صورة من المكتبة'}</span>
        </label>)}
       </div>
       {mediaOptions.length===0&&<p className={styles.helpText}>لا توجد صور متاحة بعد. أضف صورة من <Link href="/admin/media">مكتبة الوسائط</Link> ثم عد إلى المحرر.</p>}
      </>}
      <Link href="/admin/media">فتح مكتبة الوسائط</Link>
     </fieldset>

      {page==='root'&&<fieldset className={styles.projectMediaFieldset} id="portfolio-media">
       <legend>صور بطاقات الأعمال الثابتة</legend>
       <p className={styles.helpText}>اختر صورة لكل بطاقة ظاهرة في صفحة المقاولات. الاختيارات جزء من المسودة، ولا تظهر للزوار قبل النشر.</p>
       <div className={styles.projectMediaGrid}>
        {copy.projects.map(project=>{
         const previewUrl=mediaOptions.find(item=>item.id===project.mediaId)?.public_url||null;
         return <div className={styles.projectMediaRow} key={project.key}>
          <div className={styles.projectMediaDetails}>
           <strong>{project.name}</strong>
           <label className={styles.projectMediaSelect}>
            <span>الصورة المرتبطة</span>
            <select
             value={project.mediaId||''}
             disabled={!!mediaError}
             onChange={event=>updatePortfolioMedia(project.key,event.target.value)}
            >
             <option value="">بدون صورة</option>
             {mediaOptions.map((item,index)=><option key={item.id} value={item.id}>
              {(locale==='ar'?item.alt_ar:item.alt_en)||`صورة من المكتبة ${index+1}`}
             </option>)}
            </select>
           </label>
          </div>
          {previewUrl?<img className={styles.projectMediaPreview} src={previewUrl} alt={`معاينة صورة ${project.name}`}/>:<div className={styles.projectMediaNoImage}>لا توجد صورة</div>}
         </div>;
        })}
       </div>
      </fieldset>}

      {page==='root'&&<fieldset className={styles.projectMediaFieldset} id="project-media">
       <legend>صور سجلات المشاريع المنشورة</legend>
       <p className={styles.helpText}>هذه الصور تخص سجلات المشاريع المنشورة في قاعدة البيانات، وتُحفظ كمسودات حتى نشر مسودة المقاولات.</p>
       {projects.length===0?<p className={styles.helpText}>لا توجد مشاريع منشورة في قطاع المقاولات لربط صورها.</p>:<>
        {mediaOptions.length===0&&<p className={styles.helpText}>لا توجد صور متاحة. أضف الصور أولًا من <Link href="/admin/media">مكتبة الوسائط</Link>.</p>}
        <div className={styles.projectMediaGrid}>
         {projects.map(project=>{
           const selection=projectMediaSelections[project.id]||'';
           const previewUrl=selection
            ?mediaOptions.find(item=>item.id===selection)?.public_url||null
            :project.cover;
          return <div className={styles.projectMediaRow} key={project.id}>
           <div className={styles.projectMediaDetails}>
            <strong>{project.title}</strong>
            {project.summary&&<span>{project.summary}</span>}
            <label className={styles.projectMediaSelect}>
             <span>الصورة المرتبطة</span>
             <select
              name={`project_media:${project.id}`}
              value={selection}
              disabled={!!mediaError||mediaOptions.length===0}
              onChange={event=>{
               setProjectMediaSelections(current=>({...current,[project.id]:event.target.value}));
               setIsDirty(true);
              }}
             >
               <option value="">عدم تغيير الصورة المحفوظة</option>
               {mediaOptions.map((item,index)=><option key={item.id} value={item.id}>
               {(locale==='ar'?item.alt_ar:item.alt_en)||`صورة من المكتبة ${index+1}`}
              </option>)}
             </select>
            </label>
           </div>
           {previewUrl?<img className={styles.projectMediaPreview} src={previewUrl} alt={`معاينة صورة ${project.title}`}/>:<div className={styles.projectMediaNoImage}>لا توجد صورة منشورة</div>}
          </div>;
         })}
        </div>
       </>}
      </fieldset>}

     {textFields.map(([key,value])=><label className={styles.field} key={key}>
      <span>{fieldLabels[key]||key}</span>
      <textarea name={`text:${key}`} value={String(value)} maxLength={3000} rows={2} required onChange={event=>updateField(key,event.target.value)}/>
     </label>)}
     {listFields.map(([key,value])=><label className={styles.field} key={key}>
      <span>{fieldLabels[key]||key} — عنصر واحد في كل سطر</span>
      <textarea name={`list:${key}`} value={(value as string[]).join('\n')} maxLength={12000} rows={Math.min(10,Math.max(3,(value as string[]).length))} required onChange={event=>updateField(key,event.target.value.split(/\r?\n/).map(item=>item.trim()).filter(Boolean))}/>
     </label>)}
     {jsonFields.map(([key])=><label className={styles.field} key={key}>
      <span>{fieldLabels[key]||key}</span>
      <textarea name={`json:${key}`} value={jsonValues[key]||''} maxLength={30000} rows={14} required dir="ltr" aria-invalid={!!jsonErrors[key]} onChange={event=>updateJsonField(key,event.target.value)}/>
      {jsonErrors[key]&&<span className={styles.error} role="alert">{jsonErrors[key]}</span>}
     </label>)}
     <fieldset className={styles.pagesFieldset}>
      <legend>عناوين ووصف الصفحات الداخلية</legend>
      {contractingPages.map(item=><div className={styles.pageFields} key={item.slug}>
       <label className={styles.field}><span>{item.slug} — العنوان</span><input name={`page:${item.slug}:title`} value={copy.pages[item.slug].title} maxLength={3000} required onChange={event=>updatePageField(item.slug,'title',event.target.value)}/></label>
       <label className={styles.field}><span>{item.slug} — الوصف</span><textarea name={`page:${item.slug}:description`} value={copy.pages[item.slug].description} maxLength={3000} rows={2} required onChange={event=>updatePageField(item.slug,'description',event.target.value)}/></label>
      </div>)}
     </fieldset>
     <SaveButton disabled={Object.keys(jsonErrors).length>0}/>
    </form>

    {draftFound?<form action={publishContractingDraft} className={styles.publishForm}>
     <input type="hidden" name="locale" value={locale}/>
     <PublishButton disabled={isDirty||Object.keys(jsonErrors).length>0}/>
     {isDirty?<p className={styles.helpText}>احفظ التعديلات الحالية كمسودة قبل النشر.</p>:<p className={styles.helpText}>آخر حفظ للمسودة: {updatedAt}</p>}
    </form>:<p className={styles.helpText}>احفظ أول مسودة لتفعيل النشر والمعاينة الخاصة.</p>}
   </section>

   <aside className={styles.previewPanel} aria-label="معاينة الموقع">
    <header className={styles.previewHeader}>
     <div><p className={styles.eyebrow}>LIVE PREVIEW</p><h2>معاينة الموقع</h2></div>
     <span>لا تظهر للزوار قبل النشر</span>
    </header>
    <div className={styles.previewViewport} dir={locale==='ar'?'rtl':'ltr'}>
     {page==='root'
      ?<ContractingExperience locale={locale} services={services} projects={previewProjects} copy={previewCopy} heroImage={heroImage} projectImages={portfolioImages}/>
      :<ContractingInnerExperience locale={locale} page={page} copy={previewCopy} services={services} projects={projects}/>}
    </div>
   </aside>
  </div>
 </div>;
}
