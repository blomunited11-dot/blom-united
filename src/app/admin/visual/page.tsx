import {serverDb} from '@/lib/supabase/server';
import {VisualMediaEditor} from '@/components/admin/VisualMediaEditor';
import './visual.css';
export const dynamic='force-dynamic';
export default async function Page(){
 const db=await serverDb();
 const [sectors,projects,services,media,links]=await Promise.all([
 db.from('sectors').select('id,slug').order('slug').limit(100),
 db.from('projects').select('id,slug,sector_id').order('slug').limit(200),
 db.from('services').select('id,slug,sector_id').order('slug').limit(200),
 db.from('media_assets').select('id,public_url,alt_ar,sector_id').order('created_at',{ascending:false}).limit(300),
 db.from('entity_media').select('entity_type,entity_id,media_id,sort_order').limit(1000)
 ]);
 const failure=[sectors,projects,services,media,links].find(x=>x.error);
 if(failure?.error)return <p role="alert">تعذر تحميل محرر الصور: {failure.error.message}</p>;
 return <VisualMediaEditor sectors={sectors.data||[]} projects={projects.data||[]} services={services.data||[]} media={media.data||[]} links={links.data||[]}/>;
}