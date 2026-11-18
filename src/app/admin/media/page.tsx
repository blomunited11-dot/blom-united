import {serverDb} from '@/lib/supabase/server';
import {MediaStudio} from '@/components/admin/MediaStudio';
import './media-admin.css';
export const dynamic='force-dynamic';
export default async function Page(){
 const db=await serverDb();
 const [{data:items,error},{data:sectors},{data:projects},{data:services}]=await Promise.all([
  db.from('media_assets').select('id,public_url,alt_ar,alt_en,storage_path,display_ratio,display_fit,display_position,width_px,height_px').order('created_at',{ascending:false}).limit(100),
  db.from('sectors').select('id,slug').order('slug'),
  db.from('projects').select('id,slug').order('slug').limit(200),
  db.from('services').select('id,slug').order('slug').limit(200)
 ]);
 return <div className="mediaAdmin"><header className="mediaAdminHeader"><div><span className="mediaEyebrow">BLOM UNITED / CONTENT STUDIO</span><h1>استوديو الوسائط</h1><p>رفع، تحويل، ضبط إطار العرض، وربط صور المشاريع والخدمات من مكان واحد.</p></div><div className="mediaCounter"><strong>{items?.length??0}</strong><span>صورة في العرض الحالي</span></div></header>
 <MediaStudio sectors={sectors||[]} projects={projects||[]} services={services||[]}/>
 <section className="mediaLibrary"><div className="mediaLibraryHeading"><div><span className="mediaEyebrow">MEDIA LIBRARY</span><h2>الصور المحفوظة</h2></div><p>الصور الجديدة تُحفظ بصيغة WebP وتُعرض داخل الإطار المحدد دون تمدد أو تشويه.</p></div>
 {error?<p role="alert">تعذر قراءة بيانات العرض: {error.message}. تحقق من تطبيق ترحيل 005_media_presentation.sql.</p>:<div className="mediaLibraryGrid">{items?.map(x=><article className="mediaLibraryCard" key={x.id}><div className="mediaLibraryImage" style={{aspectRatio:x.display_ratio||'16/9'}}>{x.public_url?<img src={x.public_url} alt={x.alt_ar||''} loading="lazy" style={{objectFit:x.display_fit==='contain'?'contain':'cover',objectPosition:x.display_position||'center'}}/>:<span>لا توجد صورة</span>}</div><div className="mediaLibraryDetails"><strong>{x.alt_ar||'صورة بلا عنوان'}</strong><small>{x.width_px&&x.height_px?`${x.width_px} × ${x.height_px} px`:'الأبعاد غير مسجلة'} · {x.storage_path}</small></div></article>)}</div>}
 </section></div>
}
