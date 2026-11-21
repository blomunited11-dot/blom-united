'use client';

import Link from 'next/link';
import {useState,type MouseEvent} from 'react';
import {uploadContractingEditorImage} from './upload-action';
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
 more:'رابط التفاصيل',return:'رابط العودة للقطاعات',end:'النص الختامي',services:'روابط الخدمات الست',serviceMediaIds:'صور الخدمات الست',qualityMediaIds:'صور الجودة والسلامة الست',
 domains:'القطاعات المستهدفة',steps:'مراحل التنفيذ',integratedItems:'عناصر الإدارة المتكاملة',
 projects:'بطاقات الأعمال (JSON)',standardsItems:'عناصر الجودة والسلامة (JSON)'
};

function isStringList(value:unknown):value is string[]{
 return Array.isArray(value)&&value.every(item=>typeof item==='string');
}

export default function ContractingVisualEditor({
 locale,page,copy:initialCopy,mediaId,heroImage:initialHeroImage,mediaOptions,mediaError,
 projectMediaDrafts,services,projects,draftFound,updatedAt,previewHref
}:Props){
 const [copy,setCopy]=useState(initialCopy);
 const [activeText,setActiveText]=useState<string|null>(null);
 const [imagePicker,setImagePicker]=useState(false);
 const [imageSource,setImageSource]=useState<'saved'|'device'>('saved');
 const [imageTarget,setImageTarget]=useState<string>('hero');
 const [uploadedMedia,setUploadedMedia]=useState<MediaOption[]>([]);
 const [uploadError,setUploadError]=useState('');
 const [uploading,setUploading]=useState(false);
 const [activeList,setActiveList]=useState<{key:string;index:number}|null>(null);
 const [activePageField,setActivePageField]=useState<'title'|'description'|null>(null);
 const [selectedMediaId,setSelectedMediaId]=useState(mediaId||'');
 const [heroImage,setHeroImage]=useState(initialHeroImage);
 const [projectMediaSelections,setProjectMediaSelections]=useState<Record<string,string>>(()=>(
  Object.fromEntries(Object.entries(projectMediaDrafts).map(([id,draft])=>[id,draft.mediaId]))
 ));
 const [isDirty,setIsDirty]=useState(false);
 const [savedDraft,setSavedDraft]=useState(draftFound);
 const [operationBusy,setOperationBusy]=useState(false);
 const [operationMessage,setOperationMessage]=useState('');
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
  if(!selection||!selection)return project;
  const media=[...uploadedMedia,...mediaOptions].find(item=>item.id===selection);
  return media?{...project,cover:media.public_url}:project;
 });
 const visibleMediaOptions=[...uploadedMedia,...mediaOptions];
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

 async function saveDraft(form:FormData){
  setOperationBusy(true);setOperationMessage('جارٍ حفظ المسودة...');
  try{const result=await saveContractingDraft(form);if(!result.ok){setOperationMessage(result.error);return;}
   setSavedDraft(true);setIsDirty(false);setOperationMessage('تم حفظ المسودة بنجاح. يمكنك الآن نشرها.');
  }catch(error){setOperationMessage(error instanceof Error?error.message:'فشل حفظ المسودة');}
  finally{setOperationBusy(false);}
 }
 async function publishDraft(form:FormData){
  if(isDirty||!savedDraft)return;
  setOperationBusy(true);setOperationMessage('جارٍ نشر الصفحة...');
  try{const result=await publishContractingDraft(form);setOperationMessage(result.ok?'تم نشر المسودة بنجاح.':result.error);}
  catch(error){setOperationMessage(error instanceof Error?error.message:'فشل النشر');}
  finally{setOperationBusy(false);}
 }
 function chooseMedia(id:string,url:string|null){
  setSelectedMediaId(id);
  setHeroImage(url);
  setIsDirty(true);
 }

 const previewCopy=mergeContractingCopy(locale,copy);
 const serviceImages=Object.fromEntries(copy.serviceMediaIds.flatMap((id,index)=>{
  const url=visibleMediaOptions.find(item=>item.id===id)?.public_url;
  return url?[[String(index),url]]:[];
 }));
 const qualityImages=Object.fromEntries(copy.qualityMediaIds.flatMap((id,index)=>{const url=visibleMediaOptions.find(item=>item.id===id)?.public_url;return url?[[String(index),url]]:[];}));
 const portfolioImages=Object.fromEntries(previewCopy.projects.flatMap(project=>{
  const image=[...uploadedMedia,...mediaOptions].find(item=>item.id===project.mediaId)?.public_url;
  return image?[[project.key,image]]:[];
 }));

 function updateServiceMedia(index:number,mediaId:string){
  setCopy(current=>({...current,serviceMediaIds:current.serviceMediaIds.map((id,i)=>i===index?(mediaId||null):id)}));
  setIsDirty(true);
 }
 function updateQualityMedia(index:number,mediaId:string){setCopy(current=>({...current,qualityMediaIds:current.qualityMediaIds.map((id,i)=>i===index?(mediaId||null):id)}));setIsDirty(true);}
 function updatePortfolioMedia(projectKey:string,mediaId:string){
  const nextProjects=copy.projects.map(project=>project.key===projectKey
   ?{...project,mediaId:mediaId||null}
   :project);
  setCopy(current=>({...current,projects:nextProjects}));
  setJsonValues(current=>({...current,projects:JSON.stringify(nextProjects,null,2)}));
  setJsonErrors(current=>{const next={...current};delete next.projects;return next;});
  setIsDirty(true);
 }

 const editableStrings=Object.entries(copy).filter(([key,value])=>typeof value==='string'&&key!=='photo'&&key!=='pending') as [string,string][];
 function selectImage(id:string,url:string|null){
  if(imageTarget==='hero')chooseMedia(id,url);
  else if(imageTarget.startsWith('service:'))updateServiceMedia(Number(imageTarget.slice(8)),id);
  else if(imageTarget.startsWith('quality:'))updateQualityMedia(Number(imageTarget.slice(8)),id);
  else if(imageTarget.startsWith('portfolio:'))updatePortfolioMedia(imageTarget.slice(10),id);
  else if(imageTarget.startsWith('project:')){
   setProjectMediaSelections(current=>({...current,[imageTarget.slice(8)]:id}));
   setIsDirty(true);
  }
  setImagePicker(false);
 }
 async function uploadImage(form:FormData){
  setUploading(true);setUploadError('');
  try{
   const source=form.get('file');
   if(!(source instanceof File))throw new Error('اختر صورة من جهازك');
   const bitmap=await createImageBitmap(source).catch(()=>{throw new Error('تعذر قراءة الصورة؛ اختر JPG أو PNG أو WebP مدعومة');});
   const scale=Math.min(1,1920/bitmap.width,2400/bitmap.height);
   const width=Math.max(1,Math.round(bitmap.width*scale));
   const height=Math.max(1,Math.round(bitmap.height*scale));
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const context=canvas.getContext('2d');
   if(!context){bitmap.close();throw new Error('تعذر تشغيل معالج الصور');}
   context.drawImage(bitmap,0,0,width,height);bitmap.close();
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('فشل تحويل الصورة')),'image/webp',0.82));
   if(blob.type!=='image/webp'||blob.size>10*1024*1024)throw new Error('تعذر إنشاء WebP بحجم أقل من 10 ميجابايت');
   const uploadForm=new FormData();
   uploadForm.set('file',new File([blob],source.name.replace(/\\.[^.]+$/,'')+'.webp',{type:'image/webp'}));
   const result=await uploadContractingEditorImage(uploadForm);
   if(!result.ok){setUploadError(result.error);return;}
   const item:MediaOption={id:result.asset.id,public_url:result.asset.public_url,alt_ar:result.asset.alt_ar,alt_en:result.asset.alt_en};
   setUploadedMedia(current=>[item,...current]);
   selectImage(item.id,item.public_url);
  }catch(error){setUploadError(error instanceof Error?error.message:'تعذر رفع الصورة')}
  finally{setUploading(false)}
 }
 function inspectPageClick(event:MouseEvent<HTMLElement>){
  const target=event.target as HTMLElement;
  const qualityImage=target.closest('.ctQualityMedia');
  if(qualityImage){event.preventDefault();const index=Number(qualityImage.getAttribute('data-quality-index'));if(Number.isInteger(index)&&index>=0&&index<copy.qualityMediaIds.length){setImageTarget('quality:'+index);setImagePicker(true);}return;}
  const capabilityImage=target.closest('.ctCapabilityMedia');
  if(capabilityImage){
   event.preventDefault();
   const index=Number(capabilityImage.getAttribute('data-capability-index'));
   if(Number.isInteger(index)&&index>=0&&index<copy.serviceMediaIds.length){setImageTarget('service:'+index);setImagePicker(true);}
   return;
  }
  const anchor=target.closest('a[href]') as HTMLAnchorElement|null;
  if(anchor){
   const match=anchor.getAttribute('href')?.match(/^\/(?:ar|en)\/sectors\/contracting\/([^/?#]+)$/);
   if(match){event.preventDefault();window.location.href='/admin/edit/contracting?locale='+locale+'&page='+encodeURIComponent(match[1]);}
   return;
  }
  if(target.closest('button,input,select,textarea'))return;
  const media=target.closest('.ctHeroVisual,.ctCaseMedia,.ctCapabilityMedia');
  if(media){
   if(media.classList.contains('ctHeroVisual'))setImageTarget('hero');
   else if(media.classList.contains('ctCapabilityMedia')){
    const index=Number(media.getAttribute('data-capability-index'));
    if(!Number.isInteger(index)||index<0||index>=copy.serviceMediaIds.length)return;
    setImageTarget('service:'+index);
   }else{
    const card=media.closest('.ctCase');
    const cards=Array.from(card?.parentElement?.children||[]);
    const index=card?cards.indexOf(card):-1;
    if(projects.length>0){const item=projects[index];if(!item)return;setImageTarget('project:'+item.id)}
    else{const item=copy.projects[index];if(!item)return;setImageTarget('portfolio:'+item.key)}
   }
   setImagePicker(true);return;
  }
  // Text may be nested inside spans or emphasis tags. Inspect the nearest
  // matching text node before giving up on direct editing.
  const candidates:HTMLElement[]=[];
  let node:HTMLElement|null=target;
  for(let depth=0;node&&depth<4;depth++,node=node.parentElement){
   if(node===event.currentTarget)break;
   candidates.push(node);
  }
  const knownValues=[
   ...editableStrings.map(([,value])=>value),
   ...(['services','domains','steps','integratedItems'] as const).flatMap(key=>copy[key]),
   ...copy.standardsItems.flatMap(item=>[item.name,item.text]),
   ...copy.projects.flatMap(item=>[item.name,item.scope,item.category]),
   ...(page==='root'?[]:[copy.pages[page].title,copy.pages[page].description])
  ];
  const value=candidates.map(item=>item.textContent?.trim()||'').find(text=>knownValues.includes(text));
  if(!value)return;
  if(page!=='root'){
   if(value===copy.pages[page].title){setActivePageField('title');return}
   if(value===copy.pages[page].description){setActivePageField('description');return}
  }
  const field=editableStrings.find(([,text])=>text===value);
  if(field){setActiveText(field[0]);return;}
  const listKeys=['services','domains','steps','integratedItems'];
  for(const key of listKeys){
   const list=copy[key as keyof ContractingContent];
   if(Array.isArray(list)){
    const index=list.findIndex(item=>typeof item==='string'&&item===value);
    if(index>=0){setActiveList({key,index});return}
   }
  }
  const standardIndex=copy.standardsItems.findIndex(item=>item.name===value||item.text===value);
  if(standardIndex>=0){setActiveList({key:value===copy.standardsItems[standardIndex].name?'standard-name':'standard-text',index:standardIndex});return}
  const portfolioIndex=copy.projects.findIndex(item=>[item.name,item.scope,item.category].includes(value));
  if(portfolioIndex>=0){setActiveList({key:'portfolio-'+(value===copy.projects[portfolioIndex].name?'name':value===copy.projects[portfolioIndex].scope?'scope':'category'),index:portfolioIndex})}
 }
 function currentListValue(){
  if(!activeList)return '';
  const {key,index}=activeList;
  if(key.startsWith('standard-'))return copy.standardsItems[index]?.[key==='standard-name'?'name':'text']||'';
  if(key.startsWith('portfolio-'))return String(copy.projects[index]?.[key.slice(10) as 'name'|'scope'|'category']||'');
  const values=copy[key as keyof ContractingContent];
  return Array.isArray(values)?String(values[index]||''):'';
 }
 function updateListValue(value:string){
  if(!activeList)return;
  const {key,index}=activeList;
  if(key.startsWith('standard-')){
   const items=copy.standardsItems.map((item,i)=>i===index?{...item,[key==='standard-name'?'name':'text']:value}:item);
   updateField('standardsItems',items);
   setJsonValues(current=>({...current,standardsItems:JSON.stringify(items,null,2)}));
  }else if(key.startsWith('portfolio-')){
   const items=copy.projects.map((item,i)=>i===index?{...item,[key.slice(10)]:value}:item);
   updateField('projects',items);
   setJsonValues(current=>({...current,projects:JSON.stringify(items,null,2)}));
  }else{
   const values=copy[key as keyof ContractingContent];
   if(Array.isArray(values))updateField(key,values.map((item,i)=>i===index?value:item));
  }
 }

 return <div className={styles.page} dir={locale==='ar'?'rtl':'ltr'}>
  <div className={styles.columns}>
   <div style={{position:"sticky",top:0,zIndex:100,background:"#fff",padding:12,display:"flex",gap:14,flexWrap:"wrap",borderBottom:"1px solid #ddd"}}><Link href="/admin">القطاعات</Link><Link href={`/admin/edit/contracting?locale=${locale==="ar"?"en":"ar"}&page=${page}`}>{locale==="ar"?"English":"العربية"}</Link><strong>تحرير صفحة المقاولات مباشرة</strong><span>اضغط النص لتعديله أو إطار الصورة لرفع بديل</span>{operationMessage&&<span role="status" style={{color:operationMessage.includes("تم ")?"#17663b":"#a33",fontWeight:600}}>{operationMessage}</span>}<button type="button" onClick={()=>{setImageTarget("hero");setImagePicker(true)}}>اختيار صورة الواجهة</button><button type="button" onClick={()=>document.getElementById("contracting-draft-save")?.click()}>حفظ مسودة</button><button type="button" onClick={()=>{if(window.confirm("هل تؤكد نشر مسودة المقاولات وصورها على الموقع العام؟"))document.getElementById("contracting-draft-publish")?.click()}} disabled={isDirty||!savedDraft||operationBusy}>نشر</button></div>
   {activeText&&<div role="dialog" aria-modal="true" style={{position:"fixed",inset:0,zIndex:300,background:"#0009",display:"grid",placeItems:"center"}}><div style={{background:"white",color:"#111",padding:24,borderRadius:12,width:"min(92vw,650px)",display:"grid",gap:12}}><strong>{fieldLabels[activeText]||activeText}</strong><textarea dir={locale==="ar"?"rtl":"ltr"} rows={5} value={String(copy[activeText as keyof typeof copy]||"")} onChange={e=>updateField(activeText,e.target.value)} maxLength={3000}/><button type="button" onClick={()=>setActiveText(null)}>إغلاق والعودة للصفحة</button></div></div>}
   {(activeList||activePageField)&&<div role="dialog" aria-modal="true" style={{position:"fixed",inset:0,zIndex:300,background:"#0009",display:"grid",placeItems:"center"}}><div style={{background:"white",color:"#111",padding:24,borderRadius:12,width:"min(92vw,650px)",display:"grid",gap:12}}><strong>تحرير النص المحدد</strong><textarea rows={5} dir={locale==="ar"?"rtl":"ltr"} value={activePageField&&page!=='root'?copy.pages[page][activePageField]:currentListValue()} onChange={e=>activePageField&&page!=='root'?updatePageField(page,activePageField,e.target.value):updateListValue(e.target.value)}/><button type="button" onClick={()=>{setActiveList(null);setActivePageField(null)}}>إغلاق</button></div></div>}
   {imagePicker&&<div role="dialog" aria-modal="true" style={{position:"fixed",inset:0,zIndex:300,background:"#0009",display:"grid",placeItems:"center"}}><div style={{background:"white",color:"#111",padding:24,borderRadius:12,width:"min(92vw,700px)",maxHeight:"80vh",overflow:"auto",display:"grid",gap:12}}><strong>اختيار صورة للصفحة</strong><div style={{display:"flex",gap:8}}><button type="button" aria-pressed={imageSource==='saved'} onClick={()=>setImageSource('saved')} style={{padding:10,border:imageSource==='saved'?"2px solid #285a78":"1px solid #ccc",borderRadius:8}}>الصور المحفوظة ({visibleMediaOptions.length})</button><button type="button" aria-pressed={imageSource==='device'} onClick={()=>setImageSource('device')} style={{padding:10,border:imageSource==='device'?"2px solid #285a78":"1px solid #ccc",borderRadius:8}}>رفع صورة من الجهاز</button></div>{imageSource==='device'?<form action={uploadImage} style={{display:"grid",gap:8}}><label>اختر صورة من جهازك (JPG أو PNG أو WebP)<input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" required/></label><p>سيتم تحويل الصورة إلى WebP واختيارها في الصفحة؛ الحفظ والنشر خطوتان منفصلتان.</p><button type="submit" disabled={uploading}>{uploading?'جارٍ الرفع...':'تحويل الصورة واختيارها'}</button>{uploadError&&<p role="alert">{uploadError}</p>}</form>:<div style={{display:"grid",gap:10}}>{visibleMediaOptions.length===0?<p>لا توجد صور محفوظة متاحة لهذا القطاع. اختر «رفع صورة من الجهاز».</p>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>{visibleMediaOptions.map(m=><button key={m.id} type="button" onClick={()=>selectImage(m.id,m.public_url)} style={{border:selectedMediaId===m.id?"2px solid #285a78":"1px solid #ddd",padding:6,borderRadius:8}}>{m.public_url&&<img src={m.public_url} alt={m.alt_ar||""} style={{width:"100%",height:90,objectFit:"cover"}}/>}<span style={{display:"block",fontSize:12}}>{m.alt_ar||'صورة محفوظة'}</span></button>)}</div>}</div>}<button type="button" onClick={()=>setImagePicker(false)}>إغلاق</button></div></div>}
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

    <form action={saveDraft} className={styles.form}>
     <input type="hidden" name="locale" value={locale}/>
     {mediaError&&<input type="hidden" name="hero_media_id" value={selectedMediaId}/>}
     <fieldset className={styles.mediaFieldset}>
      <legend>صورة واجهة المقاولات</legend>
      <p className={styles.helpText}>اضغط إطار رفع الصورة لاختيار صورة من جهازك أو من الصور المحفوظة؛ ثم احفظ المسودة وانشرها.</p>
      {mediaError?<p className={styles.error} role="alert">تعذر تحميل مكتبة الوسائط: {mediaError}</p>:<>
       <div className={styles.mediaGrid}>
        <label className={styles.mediaChoice}>
         <input type="radio" name="hero_media_id" value="" checked={!selectedMediaId} onChange={()=>{setImageTarget("hero");setImagePicker(true)}}/>
         <span className={styles.noImage} role="button" tabIndex={0} onClick={event=>{event.preventDefault();setImageTarget("hero");setImagePicker(true)}} onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();setImageTarget("hero");setImagePicker(true)}}}>اضغط هنا لاختيار صورة</span>
         <span>من الصور المحفوظة أو جهازك</span>
        </label>
        {visibleMediaOptions.map(item=><label className={styles.mediaChoice} key={item.id}>
         <input type="radio" name="hero_media_id" value={item.id} checked={selectedMediaId===item.id} onChange={()=>chooseMedia(item.id,item.public_url||null)}/>
         {item.public_url?<img src={item.public_url} alt={locale==='ar'?item.alt_ar||'صورة من المكتبة':item.alt_en||'Library image'} loading="lazy"/>:<span className={styles.noImage}>الصورة غير متاحة</span>}
         <span>{(locale==='ar'?item.alt_ar:item.alt_en)||'صورة من المكتبة'}</span>
        </label>)}
       </div>
       {mediaOptions.length===0&&<p className={styles.helpText}>لا توجد صور متاحة بعد. أضف صورة من نافذة اختيار الصورة في المحرر ثم عد إلى المحرر.</p>}
      </>}
      
     </fieldset>

      {page==='root'&&<fieldset className={styles.projectMediaFieldset} id="service-media">
       <legend>صور نطاق أعمال متكامل — مستقلة عن صورة الواجهة</legend>
       <p className={styles.helpText}>لكل خدمة صورة مستقلة. اضغط إطارها في المعاينة أو اختر صورة محفوظة أو ارفع صورة جديدة.</p>
       <div className={styles.projectMediaGrid}>
        {copy.services.map((service,index)=>{
         const id=copy.serviceMediaIds[index];
         const url=visibleMediaOptions.find(item=>item.id===id)?.public_url;
         return <div className={styles.projectMediaRow} key={index}>
          <div className={styles.projectMediaDetails}><strong>{service}</strong>
           <label className={styles.projectMediaSelect}><span>صورة هذه الخدمة فقط</span>
            <select value={id||''} disabled={!!mediaError} onChange={event=>updateServiceMedia(index,event.target.value)}>
             <option value="">بدون صورة</option>
             {visibleMediaOptions.map(item=><option key={item.id} value={item.id}>{(locale==='ar'?item.alt_ar:item.alt_en)||'صورة محفوظة'}</option>)}
            </select>
           </label>
           <button type="button" onClick={()=>{setImageTarget('service:'+index);setImagePicker(true)}}>اختيار صورة أو رفع صورة جديدة</button>
          </div>
          {url?<img className={styles.projectMediaPreview} src={url} alt={service}/>:<div className={styles.projectMediaNoImage}>لا توجد صورة</div>}
         </div>;
        })}
       </div>
      </fieldset>}
      {page==='root'&&<fieldset className={styles.projectMediaFieldset} id="quality-media">
       <legend>صور الجودة والسلامة — ست صور مستقلة</legend>
       <p className={styles.helpText}>اختر صورة مستقلة لكل عنوان، أو اضغط إطار الصورة في معاينة الصفحة.</p>
       <div className={styles.projectMediaGrid}>
        {copy.standardsItems.map((item,index)=>{const id=copy.qualityMediaIds[index];const url=visibleMediaOptions.find(media=>media.id===id)?.public_url;return <div className={styles.projectMediaRow} key={index}>
         <div className={styles.projectMediaDetails}><strong>{item.name}</strong><label className={styles.projectMediaSelect}><span>صورة هذا العنوان</span><select value={id||''} disabled={!!mediaError} onChange={event=>updateQualityMedia(index,event.target.value)}><option value="">بدون صورة</option>{visibleMediaOptions.map(media=><option key={media.id} value={media.id}>{(locale==='ar'?media.alt_ar:media.alt_en)||'صورة محفوظة'}</option>)}</select></label><button type="button" onClick={()=>{setImageTarget('quality:'+index);setImagePicker(true)}}>اختيار صورة أو رفع صورة جديدة</button></div>
         {url?<img className={styles.projectMediaPreview} src={url} alt={item.name}/>:<div className={styles.projectMediaNoImage}>لا توجد صورة</div>}
        </div>})}
       </div>
      </fieldset>}
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
        {mediaOptions.length===0&&<p className={styles.helpText}>لا توجد صور متاحة. أضف الصور أولًا من نافذة اختيار الصورة في المحرر.</p>}
        <div className={styles.projectMediaGrid}>
         {projects.map(project=>{
          const selection=projectMediaSelections[project.id]||'';
          const previewUrl=selection&&Boolean(selection)
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
     <input type="hidden" name="json:serviceMediaIds" value={JSON.stringify(copy.serviceMediaIds)}/>
     <input type="hidden" name="json:qualityMediaIds" value={JSON.stringify(copy.qualityMediaIds)}/>
     {jsonFields.filter(([key])=>key!=='serviceMediaIds'&&key!=='qualityMediaIds').map(([key])=><label className={styles.field} key={key}>
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
     <button id="contracting-draft-save" className={styles.saveButton} type="submit" disabled={operationBusy||Object.keys(jsonErrors).length>0}>حفظ التعديلات كمسودة</button>
    </form>

    {savedDraft?<form action={publishDraft} className={styles.publishForm}>
     <input type="hidden" name="locale" value={locale}/>
    <button id="contracting-draft-publish" className={styles.publishButton} type="submit" disabled={isDirty||operationBusy||Object.keys(jsonErrors).length>0}>نشر مسودة المحتوى وصور بطاقات الأعمال</button>
     {isDirty?<p className={styles.helpText}>احفظ التعديلات الحالية كمسودة قبل النشر.</p>:<p className={styles.helpText}>آخر حفظ للمسودة: {updatedAt}</p>}
    </form>:<p className={styles.helpText}>احفظ أول مسودة لتفعيل النشر والمعاينة الخاصة.</p>}
   </section>

   <aside className={styles.previewPanel} aria-label="معاينة الموقع">
    <header className={styles.previewHeader}>
     <div><p className={styles.eyebrow}>LIVE PREVIEW</p><h2>معاينة الموقع</h2></div>
     <span>لا تظهر للزوار قبل النشر</span>
    </header>
    <div className={styles.previewViewport} onClickCapture={inspectPageClick} dir={locale==='ar'?'rtl':'ltr'}>
     {page==='root'
      ?<ContractingExperience locale={locale} services={services} projects={previewProjects} copy={previewCopy} heroImage={heroImage} projectImages={portfolioImages} serviceImages={serviceImages} qualityImages={qualityImages}/>
      :<ContractingInnerExperience locale={locale} page={page} copy={previewCopy} services={services} projects={projects}/>}
    </div>
   </aside>
  </div>
 </div>;
}
