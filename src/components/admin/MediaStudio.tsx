'use client';
import {useRef,useState} from 'react';
import {uploadMedia} from '@/app/admin/media/actions';
type Sector={id:string;slug:string};
type Item={id:string;slug:string};
export function MediaStudio({sectors,projects,services}:{sectors:Sector[];projects:Item[];services:Item[]}){
 const [file,setFile]=useState<File|null>(null),[preview,setPreview]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[fit,setFit]=useState<'cover'|'contain'>('cover'),[ratio,setRatio]=useState('16/9'),[position,setPosition]=useState('center'),[quality,setQuality]=useState(82),[maxWidth,setMaxWidth]=useState(1920),[size,setSize]=useState(''),[entityType,setEntityType]=useState('project');
 const input=useRef<HTMLInputElement>(null);
 const choices=entityType==='project'?projects:services;
 async function choose(f?:File){setError('');setNotice('');setFile(f||null);setSize('');if(preview)URL.revokeObjectURL(preview);setPreview(f?URL.createObjectURL(f):'');}
 async function processAndUpload(form:FormData){
  if(!file)return setError('اختر صورة أولًا');
  setBusy(true);setError('');setNotice('');
  try{
   const img=await createImageBitmap(file).catch(()=>{throw new Error('لا يستطيع المتصفح قراءة هذه الصيغة. استخدم JPG أو PNG أو WebP أو AVIF مدعومة، أو حوّل الملف أولًا.')});
   const scale=Math.min(1,maxWidth/img.width,2400/img.height);const width=Math.max(1,Math.round(img.width*scale)),height=Math.max(1,Math.round(img.height*scale));
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('تعذر تشغيل معالج الصور');
   ctx.drawImage(img,0,0,width,height);img.close();
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(new Error('تعذر تحويل الصورة إلى WebP')),'image/webp',quality/100));
   if(blob.type!=='image/webp')throw new Error('المتصفح لا يدعم تصدير WebP');
   if(blob.size>10*1024*1024)throw new Error('الصورة بعد التحويل أكبر من 10 ميجابايت. قلل الجودة أو العرض.');
   const processed=new File([blob],file.name.replace(/\.[^.]+$/,'')+'.webp',{type:'image/webp'});
   const data=new FormData();for(const [key,value] of form.entries())if(key!=='file')data.append(key,value);data.set('file',processed);data.set('width',String(width));data.set('height',String(height));data.set('display_ratio',ratio);data.set('display_fit',fit);data.set('display_position',position);
   const result=await uploadMedia(data);
   if(!result.ok){setError(result.error);return;}
   setSize(`${(file.size/1048576).toFixed(2)} → ${(blob.size/1048576).toFixed(2)} MB · ${width}×${height}`);
   setNotice('تم حفظ الصورة بصيغة WebP وربطها بالمحتوى المختار عند تحديده.');setFile(null);if(preview)URL.revokeObjectURL(preview);setPreview('');if(input.current)input.current.value='';
  }catch(e){setError(e instanceof Error?e.message:'فشلت معالجة الصورة')}finally{setBusy(false)}
 }
 return <form className="mediaStudio" onSubmit={e=>{e.preventDefault();void processAndUpload(new FormData(e.currentTarget))}}>
  <div className="mediaEditor">
   <section className="mediaPanel"><div className="mediaPanelTitle"><span>01</span><div><h2>مصدر الصورة</h2><p>تُعالج الصورة محليًا في المتصفح قبل إرسالها إلى التخزين.</p></div></div><label className="mediaDrop">اختر الصورة من جهازك<input ref={input} type="file" accept="image/*,.heic,.heif" onChange={e=>void choose(e.target.files?.[0])}/><small>تُقبل الملفات التي يستطيع المتصفح فك ترميزها؛ بعض الصيغ مثل HEIC قد لا تعمل.</small></label><div className="mediaFields"><p>وصف الصورة غير مطلوب؛ يكفي المحتوى النصي الموجود بجانبها في الصفحة.</p><label>القطاع<select name="sector_id"><option value="">عام</option>{sectors.map(s=><option key={s.id} value={s.id}>{s.slug}</option>)}</select></label><label>نوع الربط<select value={entityType} onChange={e=>setEntityType(e.target.value)}><option value="project">مشروع</option><option value="service">خدمة</option></select></label><label>ربط الصورة بعنصر<select name="entity_id" defaultValue="" key={entityType}><option value="">بدون ربط حاليًا</option>{choices.map(x=><option value={x.id} key={x.id}>{x.slug}</option>)}</select></label><input type="hidden" name="entity_type" value={entityType}/></div></section>
   <section className="mediaPanel"><div className="mediaPanelTitle"><span>02</span><div><h2>التحجيم والعرض</h2><p>الصورة الأصلية تُحوّل إلى WebP؛ وإعدادات الإطار تضبط ظهورها داخل الموقع.</p></div></div><div className="mediaFields"><label>نسبة إطار العرض<select value={ratio} onChange={e=>setRatio(e.target.value)}><option value="16/9">أفقي 16:9</option><option value="4/3">أفقي 4:3</option><option value="1/1">مربع 1:1</option><option value="3/4">عمودي 3:4</option><option value="21/9">بانوراما 21:9</option></select></label><label>احتواء الصورة<select value={fit} onChange={e=>setFit(e.target.value as 'cover'|'contain')}><option value="cover">ملء الإطار (قد يقص الأطراف)</option><option value="contain">الصورة كاملة (قد تظهر هوامش)</option></select></label><label>موضع التركيز<select value={position} onChange={e=>setPosition(e.target.value)}><option value="center">الوسط</option><option value="top">الأعلى</option><option value="bottom">الأسفل</option><option value="left">اليسار</option><option value="right">اليمين</option></select></label><label>أقصى عرض للصورة<select value={maxWidth} onChange={e=>setMaxWidth(Number(e.target.value))}><option value={1200}>1200px</option><option value={1600}>1600px</option><option value={1920}>1920px</option><option value={2400}>2400px</option></select></label><label>جودة WebP: {quality}%<input type="range" min="55" max="95" value={quality} onChange={e=>setQuality(Number(e.target.value))}/></label></div></section>
  </div>
  <section className="mediaPanel mediaPreviewPanel"><div className="mediaPanelTitle"><span>03</span><div><h2>معاينة النتيجة قبل الحفظ</h2><p>المعاينة توضح القص والاحتواء دون تشويه أبعاد الصورة.</p></div></div><div className="mediaPreviewFrame" style={{aspectRatio:ratio,background:'#eaf0f5'}}>{preview?<img src={preview} alt="معاينة الصورة المختارة" style={{width:'100%',height:'100%',objectFit:fit,objectPosition:position}}/>:<span>اختر صورة لمعاينة إطارها</span>}</div><div className="mediaSubmit"><button type="submit" className="action" disabled={busy||!file}>{busy?'جارٍ التحويل والرفع…':'تحويل إلى WebP وحفظ الصورة'}</button>{size&&<span>{size}</span>}</div>{error&&<p role="alert" className="mediaError">{error}</p>}{notice&&<p role="status" className="mediaSuccess">{notice}</p>}</section>
 </form>
}
