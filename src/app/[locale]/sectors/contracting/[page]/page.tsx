import {notFound} from 'next/navigation';
import {localeOf} from '@/lib/i18n/dictionary';
import {published} from '@/lib/data/site';
import {getContractingCopy,getContractingDraftPreview} from '@/lib/data/contracting';
import ContractingInnerExperience from '@/components/contracting/ContractingInnerExperience';
import {contractingPages} from '@/config/contracting.pages';

export const dynamic='force-dynamic';
export function generateStaticParams(){return []}
type Props={params:Promise<{locale:string;page:string}>;searchParams:Promise<{previewDraft?:string}>};

export default async function ContractingInnerPage({params,searchParams}:Props){
 const [{locale,page},{previewDraft}]=await Promise.all([params,searchParams]);
 const l=localeOf(locale);
 const definition=contractingPages.find(item=>item.slug===page);
 if(!definition)notFound();
 const preview=previewDraft==='1'?await getContractingDraftPreview(l):null;
 if(previewDraft==='1'&&(!preview?.authorized||!preview.found))notFound();
 const copy=preview?.copy||await getContractingCopy(l);
 const sector=(await published('sectors',l)).find(item=>item.slug==='contracting');
 const [projects,services]=await Promise.all([
  sector?published('projects',l,sector.id):Promise.resolve([]),
  sector?published('services',l,sector.id):Promise.resolve([])
 ]);
 return <ContractingInnerExperience locale={l} page={definition.slug} copy={copy} projects={projects} services={services}/>;
}
