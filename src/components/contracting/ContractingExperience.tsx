import Link from 'next/link';
import type {ReactNode} from 'react';
import type {Locale} from '@/lib/i18n/dictionary';
import type {Entry} from '@/lib/data/site';
import {mergeContractingCopy,type ContractingCopy} from '@/lib/data/contracting-copy';
import {contractingDefaultContent} from '@/config/contracting.content';
import './contracting.css';

export default function ContractingExperience({locale,services,projects,copy={},heroImage=null,projectImages={},serviceImages={},qualityImages={},domainImages={},lifecycleImage=null,integratedImage=null,editorControls=null}:{locale:Locale;services:Entry[];projects:Entry[];copy?:ContractingCopy;heroImage?:string|null;projectImages?:Record<string,string>;serviceImages?:Record<string,string>;qualityImages?:Record<string,string>;domainImages?:Record<string,string>;lifecycleImage?:string|null;integratedImage?:string|null;editorControls?:ReactNode}){
 const t=mergeContractingCopy(locale,copy);
 // The editorial portfolio is managed by the contracting content editor.
 // Published project entities must not replace its three-image showcases.
 const portfolio=t.projects.map(project=>({
  key:project.key,
  name:project.name,
  category:project.category,
  scope:project.scope,
  stages:project.stages,
  cover:projectImages[project.key]||null,
  href:null as string|null
 }));
 return <main className="contracting">
  {editorControls}
  <section className="ctHero"><div className="ctWrap ctHeroGrid">
   <div className="ctHeroText"><span className="ctKicker">{t.label}</span><h1>{t.title}</h1><p className="ctLead">{t.lead}</p><p className="ctIntro">{t.intro}</p><div className="ctActions"><a href="#ct-projects" className="ctPrimary">{t.seeProjects} <span aria-hidden="true">↗</span></a><Link href={`/${locale}/contact`} className="ctSecondary">{t.contact}</Link></div></div>
   <div className="ctHeroVisual ctImagePlaceholder" role={heroImage?undefined:'img'} aria-label={heroImage?undefined:t.photo}>{heroImage?<img src={heroImage} alt={t.photo} style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0,zIndex:2}}/>:<><span className="ctVisualGrid" aria-hidden="true"/><span className="ctVisualOutline" aria-hidden="true"/></>}</div>
  </div></section>
  <section className="ctSection ctWrap" id="ct-services"><div className="ctSectionHead"><div><span className="ctKicker">01 / CAPABILITIES</span><h2>{t.capabilities}</h2></div><p>{t.capIntro}</p></div><div className="ctCapabilities">{t.services.map((s,i)=><article className="ctCapability" key={s}><span>{String(i+1).padStart(2,'0')}</span><div className="ctCapabilityMedia" data-capability-index={i}>{serviceImages[String(i)]?<img src={serviceImages[String(i)]} alt={s} loading="lazy"/>:<span className="ctCapabilityPlaceholder" aria-label={locale==='ar'?'اختر صورة الخدمة':'Choose service image'}>{locale==='ar'?'صورة الخدمة':'Service image'}</span>}</div><h3>{s}</h3></article>)}</div>{services.length>0&&<div className="ctLiveList"><h3>{t.publishedServices}</h3>{services.map(s=><Link key={s.id} href={`/${locale}/sectors/contracting/services/${s.slug}`}>{s.title}<span aria-hidden="true">↗</span></Link>)}</div>}</section>
  <section className="ctBand" id="ct-quality"><div className="ctWrap"><div className="ctSectionHead"><div><span className="ctKicker">02 / QUALITY & SAFETY</span><h2>{t.standards}</h2></div></div><div className="ctStandards">{t.standardsItems.map((s,i)=><article key={i} className="ctQualityCard"><div className="ctQualityMedia" data-quality-index={i}>{qualityImages[String(i)]?<img src={qualityImages[String(i)]} alt={s.name} loading="lazy"/>:<span>{locale==='ar'?'صورة الجودة والسلامة':'Quality and safety image'}</span>}</div><span>{String(i+1).padStart(2,'0')}</span><h3>{s.name}</h3><p>{s.text}</p></article>)}</div></div></section>
  <section className="ctBand"><div className="ctWrap"><div className="ctSectionHead"><div><span className="ctKicker">03 / SECTORS</span><h2>{t.domainsTitle}</h2></div></div><div className="ctDomains">{t.domains.map((d,i)=><article className="ctDomainCard" key={i}><div className="ctDomainMedia" data-domain-index={i}>{domainImages[String(i)]?<img src={domainImages[String(i)]} alt={d} loading="lazy"/>:<span>{locale==='ar'?'صورة القطاع':'Sector image'}</span>}</div><span>{String(i+1).padStart(2,'0')}</span><h3>{d}</h3></article>)}</div></div></section>
  <section className="ctSection ctWrap" id="ct-projects"><div className="ctSectionHead"><div><span className="ctKicker">{'04 / PORTFOLIO'}</span><h2>{t.workTitle}</h2></div></div><div className="ctCaseGrid">{portfolio.map((p,i)=>{
   const showcase= i<9 && (p.key.startsWith('taiba-medical-complex-')||p.key.startsWith('blom-united-headquarters')||p.key.startsWith('palace-of-sweet-memories'));
   const featured=showcase?i%3===0:i===0;
   const imageOnly=showcase&&!featured;
   return <article className={featured?'ctCase ctCaseFeatured ctCaseShowcase':'ctCase'} key={p.key}>
    <div className="ctCaseMedia ctImagePlaceholder">{p.cover?<img src={p.cover} alt={p.name} loading="lazy"/>:<div className="ctCasePlaceholder" aria-hidden="true"/>}{!showcase&&<span className="ctCaseNumber">{String(i+1).padStart(2,'0')}</span>}</div>
    {!imageOnly&&<div className="ctCaseBody">{p.category&&<span className="ctKicker">{p.category}</span>}<h3>{p.href?<Link href={p.href}>{p.name}</Link>:p.name}</h3>{p.scope&&<p>{p.scope}</p>}{!showcase&&p.stages.length>0&&<div className="ctStageTags">{p.stages.map(stage=><span key={stage}>{stage}</span>)}</div>}</div>}
   </article>;
  })}</div></section>
  <section className="ctBand ctLifecycleBanner" id="ct-process"><div className="ctWrap"><div className="ctSectionHead"><div><span className="ctKicker">05 / LIFECYCLE</span><h2>{t.lifecycle}</h2></div></div><div className="ctLifecycleImage" data-lifecycle-media="true">{lifecycleImage?<img src={lifecycleImage} alt={t.lifecycle} loading="lazy"/>:<div className="ctLifecycleEmpty" aria-hidden="true"/>}</div></div></section>
  <section className="ctSection ctWrap" id="ct-integrated"><div className="ctSectionHead"><div><span className="ctKicker">06 / DELIVERY</span><h2>{t.integrated}</h2></div><p>{t.integratedIntro}</p></div><div className="ctIntegratedImage" data-integrated-media="true">{integratedImage?<img src={integratedImage} alt={t.integrated} loading="lazy"/>:<div className="ctIntegratedEmpty" aria-hidden="true"/>}<div className="ctIntegratedStages" aria-label={t.integrated}>{t.integratedItems.map((item,index)=><div className="ctIntegratedStage" key={index}><span className="ctIntegratedStageNumber">{String(index+1).padStart(2,'0')}</span><span className="ctIntegratedStageLabel">{item}</span></div>)}</div></div></section>
  <section className="ctClosing"><div className="ctWrap ctClosingInner"><div className="ctClosingLinks"><Link href={`/${locale}/contact`}>{t.contact}</Link><Link href={`/${locale}/sectors`}>{t.return}</Link></div></div></section>
 </main>
}
