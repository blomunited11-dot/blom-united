import {redirect} from 'next/navigation';
import {serverDb} from '@/lib/supabase/server';
import ContractingVisualEditor from '@/app/admin/edit/contracting/ContractingVisualEditor';
import {contractingPages,type ContractingPageSlug} from '@/config/contracting.pages';
import {
 getContractingDraft,
 getContractingHeroImage,
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
 const mediaId=draft.found?draft.heroMediaId:liveCopy.heroMediaId||null;
 const heroImage=draft.found?draft.heroImage:await getContractingHeroImage(locale);
 const mediaOptions=(media||[]).filter(item=>item.public_url&&(!item.sector_id||item.sector_id===sector.id));
 const sectorPublished=(await published('sectors',locale)).find(item=>item.slug==='contracting');
 const [services,projects]=await Promise.all([
  sectorPublished?published('services',locale,sectorPublished.id):Promise.resolve([]),
  sectorPublished?published('projects',locale,sectorPublished.id):Promise.resolve([])
 ]);
 const previewHref=page==='root'
  ?`/${locale}/sectors/contracting?previewDraft=1`
  :`/${locale}/sectors/contracting/${page}?previewDraft=1`;
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
  services={services}
  projects={projects}
  draftFound={draft.found}
  updatedAt={draft.updatedAt}
  previewHref={previewHref}
 />;
}
