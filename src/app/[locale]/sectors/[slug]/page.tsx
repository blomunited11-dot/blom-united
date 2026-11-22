import {notFound} from 'next/navigation';
import {dict,sectors,localeOf} from '@/lib/i18n/dictionary';
import {published} from '@/lib/data/site';
import Link from 'next/link';
import ContractingExperience from '@/components/contracting/ContractingExperience';
import {getContractingCopy,getContractingDraftPreview,getContractingHeroImage,getContractingPortfolioImages,mergeContractingCopy} from '@/lib/data/contracting';
import {withContractingProjectMediaDrafts} from '@/lib/data/contracting-project-media';
export const dynamic='force-dynamic';
export default async function Sector({params,searchParams}:{params:Promise<{locale:string;slug:string}>;searchParams:Promise<{previewDraft?:string}>}){
 const [{locale,slug},{previewDraft}]=await Promise.all([params,searchParams]),l=localeOf(locale),s=sectors.find(x=>x.slug===slug);
 if(!s)notFound();
 const sector=(await published('sectors',l)).find(x=>x.slug===slug);
 const services=sector?await published('services',l,sector.id):[];
 const projects=sector?await published('projects',l,sector.id):[];
 if(slug==='contracting'){
  const preview=previewDraft==='1'?await getContractingDraftPreview(l):null;
  if(previewDraft==='1'&&(!preview?.authorized||!preview.found))notFound();
  const [copy,heroImage]=await Promise.all([
   preview?Promise.resolve(preview.copy):getContractingCopy(l),
   preview?Promise.resolve(preview.heroImage):getContractingHeroImage(l)
  ]);
  const previewProjects=preview?withContractingProjectMediaDrafts(projects,preview.projectMediaDrafts):projects;
  const mergedCopy=mergeContractingCopy(l,copy);
  // Media is shared between languages: English copy can be translated independently
  // without requiring editors to upload or select every image a second time.
  const arabicMediaCopy=l==='en'?mergeContractingCopy('ar',await getContractingCopy('ar')):null;
  const arabicProjects=new Map(arabicMediaCopy?.projects.map(project=>[project.key,project.mediaId])||[]);
  const mediaSelections=[
   {key:'integrated-banner',mediaId:mergedCopy.integratedMediaId||arabicMediaCopy?.integratedMediaId},
   {key:'lifecycle-banner',mediaId:mergedCopy.lifecycleMediaId||arabicMediaCopy?.lifecycleMediaId},
   ...mergedCopy.projects.map(project=>({...project,mediaId:project.mediaId||arabicProjects.get(project.key)||null})),
   ...mergedCopy.serviceMediaIds.map((mediaId,index)=>({key:`service-${index}`,mediaId:mediaId||arabicMediaCopy?.serviceMediaIds[index]||null})),
   ...mergedCopy.qualityMediaIds.map((mediaId,index)=>({key:`quality-${index}`,mediaId:mediaId||arabicMediaCopy?.qualityMediaIds[index]||null})),
   ...mergedCopy.domainMediaIds.map((mediaId,index)=>({key:`domain-${index}`,mediaId:mediaId||arabicMediaCopy?.domainMediaIds[index]||null}))
  ];
  const images=await getContractingPortfolioImages(mediaSelections);
  const serviceImages=Object.fromEntries(mergedCopy.serviceMediaIds.flatMap((_,index)=>images[`service-${index}`]?[[String(index),images[`service-${index}`]]]:[]));
  const qualityImages=Object.fromEntries(mergedCopy.qualityMediaIds.flatMap((_,index)=>images[`quality-${index}`]?[[String(index),images[`quality-${index}`]]]:[]));
  const domainImages=Object.fromEntries(mergedCopy.domainMediaIds.flatMap((_,index)=>images[`domain-${index}`]?[[String(index),images[`domain-${index}`]]]:[]));
  const projectImages=images;
  const sharedHeroImage=heroImage||(l==='en'?await getContractingHeroImage('ar'):null);
  return <ContractingExperience locale={l} services={services} projects={previewProjects} copy={mergedCopy} heroImage={sharedHeroImage} projectImages={projectImages} serviceImages={serviceImages} qualityImages={qualityImages} domainImages={domainImages} lifecycleImage={images['lifecycle-banner']||null} integratedImage={images['integrated-banner']||null}/>;
 }
 return <main className="container page"><h1>{sector?.title||s[l]}</h1><p>{sector?.summary||dict[l].noContent}</p><h2>{l==='ar'?'الخدمات':'Services'}</h2><div className="cards">{services.map(x=><Link className="card cardBody" key={x.id} href={`/${l}/sectors/${slug}/services/${x.slug}`}>{x.title}</Link>)}</div><h2>{dict[l].projects}</h2><div className="cards">{projects.map(x=><Link className="card cardBody" key={x.id} href={`/${l}/projects/${x.slug}`}>{x.title}</Link>)}</div></main>;
}
