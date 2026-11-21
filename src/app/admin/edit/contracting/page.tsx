import {redirect} from 'next/navigation';
import {serverDb} from '@/lib/supabase/server';
import ContractingVisualEditor from '@/app/admin/edit/contracting/ContractingVisualEditor';
import {contractingPages,type ContractingPageSlug} from '@/config/contracting.pages';
import {
 getContractingDraft,
 getContractingHeroImage,
 getContractingPortfolioImages,
 mergeContractingCopy,
 readContractingCopy
} from '@/lib/data/contracting';
import {published} from '@/lib/data/site';
import type {Locale} from '@/lib/i18n/dictionary';

export const dynamic='force-dynamic';
type Props={searchParams:Promise<{locale?:string;page?:string}>};

export default async function ContractingVisualEditorPage({searchParams}:Props){
 const {locale:requestedLocale,page:requestedPage}=await searchParams;
 const locale:Locale=requestedLocale==='en'?'en':'ar';
  const selectedPage=contractingPages.find(item=>item.slug===requestedPage);
  const page:ContractingPageSlug|'root'=requestedPage==='root'?'root':selectedPage?.slug||'root';
 let draft;
 try{
  draft=await getContractingDraft(locale);
 }catch(error){
  return <p role="alert">تعذر تحميل المسودة أو صور المشاريع: {error instanceof Error?error.message:'خطأ غير معروف'}</p>;
 }
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
 // A newly created or draft sector may not yet have a published translation.
 // The editor must still open so an owner can prepare its first publication.
 const liveCopy=readContractingCopy(row?.body);
 const copy=mergeContractingCopy(locale,liveCopy,draft.copy);
 const mediaId=draft.found?draft.heroMediaId:liveCopy.heroMediaId||null;
 const heroImage=draft.found?draft.heroImage:row?await getContractingHeroImage(locale):null;
 const mediaOptions=(media||[]).filter(item=>item.public_url&&(!item.sector_id||item.sector_id===sector.id));
 const portfolioImages=await getContractingPortfolioImages(copy.projects);
 for(const project of copy.projects){
  const publicUrl=portfolioImages[project.key];
  if(project.mediaId&&publicUrl&&!mediaOptions.some(item=>item.id===project.mediaId)){
   mediaOptions.unshift({
    id:project.mediaId,
    public_url:publicUrl,
    alt_ar:'صورة بطاقة أعمال',
    alt_en:'Portfolio card image',
    sector_id:sector.id
   });
  }
 }
 for(const projectDraft of Object.values(draft.projectMediaDrafts)){
  if(!mediaOptions.some(item=>item.id===projectDraft.mediaId)){
   mediaOptions.unshift({
    id:projectDraft.mediaId,
    public_url:projectDraft.publicUrl,
    alt_ar:'صورة محفوظة كمسودة',
    alt_en:'Draft image',
    sector_id:sector.id
   });
  }
 }
 const sectorPublished=(await published('sectors',locale)).find(item=>item.slug==='contracting');
 const [services,projects]=await Promise.all([
  sectorPublished?published('services',locale,sectorPublished.id):Promise.resolve([]),
  sectorPublished?published('projects',locale,sectorPublished.id):Promise.resolve([])
 ]);
  const previewHref=`/${locale}/sectors/contracting/${page}?previewDraft=1`;
 const editorKey=`${locale}:${page}:${draft.updatedAt||'unsaved'}:${mediaId||'no-image'}`;

 return <ContractingVisualEditor
  key={editorKey}
  locale={locale}
  page={page}
  copy={copy}
  mediaId={mediaId}
  heroImage={heroImage}
  mediaOptions={mediaOptions}
  mediaError={mediaError?.message||null}
  projectMediaDrafts={draft.projectMediaDrafts}
  services={services}
  projects={projects}
  draftFound={draft.found}
  updatedAt={draft.updatedAt}
  previewHref={previewHref}
 />;
}
