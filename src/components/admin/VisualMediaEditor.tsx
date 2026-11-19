'use client';
import {useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {assignMediaSlot} from '@/app/admin/visual/actions';
import {uploadMedia} from '@/app/admin/media/actions';
type Entity={id:string;slug:string;sector_id?:string|null};
type Media={id:string;public_url:string|null;alt_ar:string|null;sector_id:string|null};
type Link={entity_type:string;entity_id:string;media_id:string;sort_order:number};
type Kind='sector'|'project'|'service';
const slots=[{name:'الصورة الرئيسية',hint:'الصورة الأبرز في بداية الصفحة',ratio:'16/9'},{name:'الصورة التعريفية',hint:'بجانب نبذة القطاع أو المشروع',ratio:'4/3'},{name:'صورة التفاصيل الأولى',hint:'ضمن معرض المحتوى',ratio:'4/3'},{name:'صورة التفاصيل الثانية',hint:'ضمن معرض المحتوى',ratio:'4/3'}];
export function VisualMediaEditor({sectors,projects,services,media,links}:{sectors:Entity[];projects:Entity[];services:Entity[];media:Media[];links:Link[]}){
 const router=useRouter(),fileInput=useRef<HTMLInputElement>(null);
 const [kind,setKind]=useState<Kind>('sector'),[selected,setSelected]=useState(''),[slot,setSlot]=useState<number|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const entities=kind==='sector'?sectors:kind==='project'?projects:services;
 const current=entities.find(x=>x.id===selected);
 const sectorId=kind==='sector'?selected:current?.sector_id||'';
 const existing=(n:number)=>links.find(x=>x.entity_type===kind&&x.entity_id===selected&&x.sort_order===n);
 const asset=(n:number)=>media.find(x=>x.id===existing(n)?.media_id);
 const eligible=media.filter(x=>!x.sector_id||!sectorId||x.sector_id===sectorId);
 async function assign(mediaId:string){
  if(!selected||slot===null)return;
  setBusy(true);setError('');setNotice('');
  try{await assignMediaSlot({entityType:kind,entityId:selected,mediaId,slot});setNotice('تم حفظ موضع الصورة بنجاح');setSlot(null);router.refresh();}
  catch(e){setError(e instanceof Error?e.message:'تعذر ربط الصورة')}finally{setBusy(false)}
 }
 async function upload(file?:File){
  if(!file||!selected||slot===null)return;
  const target=slot;setBusy(true);setError('');setNotice('');
  try{
   const bitmap=await createImageBitmap(file);const scale=Math.min(1,1920/bitmap.width,1920/bitmap.height);
   const w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');
   if(!ctx)throw new Error('تعذرت معالجة الصورة');ctx.drawImage(bitmap,0,0,w,h);bitmap.close();
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('فشل تحويل الصورة')),'image/webp',0.82));
   if(blob.type!=='image/webp'||blob.size>10*1024*1024)throw new Error('تعذر تحويل الصورة إلى WebP بحجم أقل من 10MB');
   const data=new FormData();data.set('file',new File([blob],file.name.replace(/\.[^.]+$/,'')+'.webp',{type:'image/webp'}));
   data.set('width',String(w));data.set('height',String(h));data.set('display_ratio',slots[target].ratio);data.set('display_fit','cover');data.set('display_position','center');
   data.set('alt_ar',file.name.replace(/\.[^.]+$/,'').slice(0,300));data.set('alt_en',file.name.replace(/\.[^.]+$/,'').slice(0,300));
   data.set('sector_id',sectorId);data.set('entity_type',kind);data.set('entity_id',selected);data.set('slot',String(target));
   await uploadMedia(data);setNotice('تم رفع الصورة إلى المكتبة وربطها بالموضع');setSlot(null);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'فشل الرفع')}finally{setBusy(false);if(fileInput.current)fileInput.current.value=''}
 }
 return <div className="visualEditor" dir="rtl">
  <header><span className="mediaEyebrow">BLOM UNITED / VISUAL EDITOR</span><h1>محرر الصور حسب الصفحة</h1><p>اختر القطاع أو المشروع، ثم اضغط موضع الصورة لتعيين صورة من المكتبة أو رفع صورة جديدة من جهازك.</p></header>
  <div className="visualControls"><label>نوع المحتوى<select value={kind} onChange={e=>{setKind(e.target.value as Kind);setSelected('');setSlot(null)}}><option value="sector">القطاعات</option><option value="project">المشاريع</option><option value="service">الخدمات</option></select></label><label>اختر الصفحة<select value={selected} onChange={e=>{setSelected(e.target.value);setSlot(null)}}><option value="">اختر عنصرًا</option>{entities.map(x=><option key={x.id} value={x.id}>{x.slug}</option>)}</select></label></div>
  {selected?<><div className="visualPage"><div className="visualPageTitle"><strong>{current?.slug}</strong><small>مخطط تحريري لمواضع الصور — ليس معاينة مطابقة للموقع المنشور</small></div><div className="visualSlotGrid">{slots.map((s,i)=>{const m=asset(i);return <button type="button" key={i} className={'visualSlot '+(i===0?'visualHero':'')} onClick={()=>{setSlot(i);setError('');setNotice('')}}><div className="visualSlotImage" style={{aspectRatio:s.ratio}}>{m?.public_url?<img src={m.public_url} alt={m.alt_ar||s.name}/>:<span>+ اختر صورة</span>}</div><strong>{s.name}</strong><small>{s.hint}</small></button>})}</div></div>
  {slot!==null&&<section className="visualPicker"><div className="visualPickerTop"><h2>تعيين: {slots[slot].name}</h2><button type="button" onClick={()=>setSlot(null)}>إغلاق ×</button></div><div className="visualPickerActions"><button type="button" className="action" disabled={busy} onClick={()=>fileInput.current?.click()}>رفع صورة من الجهاز</button><input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={e=>void upload(e.target.files?.[0])}/><span>أو اختر صورة محفوظة من المكتبة:</span></div><div className="visualLibrary">{eligible.map(m=><button key={m.id} type="button" disabled={busy} onClick={()=>void assign(m.id)}>{m.public_url?<img src={m.public_url} alt={m.alt_ar||'صورة محفوظة'}/>:<span>بدون معاينة</span>}<small>{m.alt_ar||'صورة بدون وصف'}</small></button>)}{eligible.length===0&&<p>لا توجد صور محفوظة مناسبة لهذا القطاع. ارفع أول صورة من جهازك.</p>}</div></section>}</>:<p className="visualEmpty">اختر قطاعًا أو مشروعًا لعرض مواضع الصور.</p>}
  {busy&&<p role="status">جارٍ حفظ التغييرات…</p>}{error&&<p role="alert" className="mediaError">{error}</p>}{notice&&<p role="status" className="mediaSuccess">{notice}</p>}
 </div>;
}
