'use client';

import {useState,useEffect} from 'react';
import type {Locale} from '@/lib/i18n/dictionary';

type Props={locale:Locale;title:string;intro:string;steps:string[]};
const descriptions={
 ar:['تحديد الاحتياج، دراسة الجدوى، ورسم التصور الأول للمشروع.','تحويل الفكرة إلى مخططات تنفيذية واستكمال المتطلبات النظامية.','تهيئة الأرض وبدء أعمال الحفر والتجهيز.','تنفيذ القواعد والأعمدة والهيكل الخرساني وفق المخططات.','تشكيل الفراغات والجدران والواجهات المعمارية.','تنفيذ وتمديد واختبار الأنظمة الكهربائية والميكانيكية.','إكمال الواجهات والتفاصيل الداخلية والتشطيبات النهائية.','الفحص والتشغيل والتسليم المنظم مع متطلبات الضمان.'],
 en:['Define the brief, assess feasibility and shape the initial concept.','Develop working drawings and secure required approvals.','Prepare the site and begin excavation and earthworks.','Construct foundations, columns and the structural frame.','Form spaces, walls and architectural facades.','Install and test mechanical, electrical and plumbing systems.','Complete facades, interiors and finishing details.','Inspect, commission and hand over with warranty documentation.']
};
export default function ContractingLifecycle({locale,title,intro,steps}:Props){
 const [active,setActive]=useState(0);
 const [reduceMotion,setReduceMotion]=useState(false);
 useEffect(()=>{const mq=window.matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduceMotion(mq.matches);sync();mq.addEventListener('change',sync);return()=>mq.removeEventListener('change',sync)},[]);
 const label=locale==='ar'?'المرحلة':'Stage';
 return <section className="ctBand ctLifecycleSection" id="ct-process" aria-label={title}>
  <div className="ctWrap">
   <div className="ctSectionHead"><div><span className="ctKicker">05 / LIFECYCLE</span><h2>{title}</h2></div><p>{intro}</p></div>
   <div className="ctJourney">
    <div className="ctJourneyScene" aria-hidden="true">
     <svg viewBox="0 0 1100 530" role="presentation" preserveAspectRatio="xMidYMid meet">
      <defs>
       <linearGradient id="ctSky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#c9d9e2"/><stop offset="1" stopColor="#f0eee7"/></linearGradient>
       <linearGradient id="ctFacade" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e5e0d5"/><stop offset="1" stopColor="#aab5b9"/></linearGradient>
       <linearGradient id="ctGlass" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#7395a4"/><stop offset="1" stopColor="#253f50"/></linearGradient>
       <pattern id="ctGrid" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M34 0H0V34" fill="none" stroke="#607d8b" strokeWidth=".8" opacity=".22"/></pattern>
      </defs>
      <rect width="1100" height="530" fill="url(#ctSky)"/>
      <path d="M0 348Q240 328 430 346T1100 336V530H0Z" fill="#c6c3b9"/>
      <path d="M0 425L1100 402V530H0Z" fill="#b3b2a8"/>
      {active<=1&&<g className="ctSceneReveal"><rect x="205" y="108" width="690" height="320" fill="#ffffff5c" stroke="#4b7180" strokeWidth="2" strokeDasharray="9 7"/><rect x="205" y="108" width="690" height="320" fill="url(#ctGrid)"/><path d="M205 428L460 305L895 428M205 108L460 305L895 108M550 108V428" fill="none" stroke="#4b7180" strokeWidth="2" opacity=".65"/><path d="M240 396H860M240 365H860M240 334H860" stroke="#4b7180" opacity=".5"/><circle cx="460" cy="305" r="17" fill="none" stroke="#456777" strokeWidth="3"/></g>}
      {active>=2&&<g className="ctSceneReveal"><path d="M160 428L285 370L900 370L1030 428L900 473L285 473Z" fill="#938b7d"/><path d="M285 370V430L900 430V370" fill="#a9a297"/>{active===2&&<><path d="M295 389H890M320 408H865" stroke="#685d4f" strokeWidth="8" strokeDasharray="30 15"/><path d="M165 410L315 355" stroke="#75664d" strokeWidth="24"/><circle cx="240" cy="367" r="19" fill="#b99543"/></>}</g>}
      {active>=3&&<g className="ctSceneReveal">
       <rect x="285" y="360" width="615" height="52" fill="#92999a" stroke="#58636a" strokeWidth="4"/>
       {Array.from({length:5},(_,i)=><g key={i}><rect x={315+i*140} y={160} width="24" height="201" fill="#9ea9aa" stroke="#64737a" strokeWidth="2"/><rect x={315+i*140} y={160} width="24" height="201" fill="none" stroke="#556d7a" strokeDasharray={active===3?'5 7':'0'} strokeWidth="2"/></g>)}
       <rect x="305" y="245" width="570" height="24" fill="#b3b9b7"/><rect x="305" y="160" width="570" height="24" fill="#b3b9b7"/>
       {active===3&&<><path d="M295 159H888M295 245H888" stroke="#60777f" strokeWidth="2" strokeDasharray="8 5"/><path d="M695 159V70H910" stroke="#947e51" strokeWidth="5"/><path d="M900 70V225" stroke="#947e51" strokeWidth="3"/></>}
      </g>}
      {active>=4&&<g className="ctSceneReveal">
       <rect x="340" y="183" width="520" height="175" fill={active>=6?'url(#ctFacade)':'#c8c5bb'}/>
       {Array.from({length:6},(_,i)=><path key={i} d={`M340 ${208+i*25}H860`} stroke="#989f9e" strokeWidth="1.5" opacity=".8"/>)}
       {active===4&&Array.from({length:9},(_,i)=><path key={i} d={`M${355+i*55} 184V358`} stroke="#9a9c96" opacity=".55"/>)}
      </g>}
      {active>=5&&<g className="ctSceneReveal">
       {active===5&&<><path d="M345 300H835V208H560V332H715" fill="none" stroke="#287b99" strokeWidth="9" strokeLinecap="round"/><path d="M415 183V340H625" fill="none" stroke="#a46d45" strokeWidth="7"/><circle cx="560" cy="208" r="11" fill="#f0c66c"/><circle cx="715" cy="332" r="11" fill="#f0c66c"/></>}
       {active>=6&&<><rect x="360" y="200" width="480" height="142" fill="url(#ctGlass)"/>{Array.from({length:7},(_,i)=><path key={i} d={`M${360+i*80} 200V342`} stroke="#e4e9e5" strokeWidth="8"/>)}<path d="M360 270H840" stroke="#dfe5e5" strokeWidth="8"/><rect x="570" y="270" width="80" height="72" fill="#304a58" stroke="#e5e9e5" strokeWidth="5"/><path d="M345 180H855" stroke="#f6f1e8" strokeWidth="17"/></>}
      </g>}
      {active===7&&<g className="ctSceneReveal"><path d="M160 445Q530 422 1040 445" stroke="#eee8da" strokeWidth="35" fill="none"/><rect x="190" y="399" width="20" height="46" fill="#4c6a55"/><circle cx="200" cy="390" r="31" fill="#607e62"/><rect x="946" y="400" width="20" height="46" fill="#4c6a55"/><circle cx="956" cy="392" r="32" fill="#607e62"/><path d="M460 442H740" stroke="#f8f6ee" strokeWidth="5"/></g>}
      <path d="M0 500H1100" stroke="#d9d6cb" strokeWidth="2"/>
     </svg>
     <div className="ctJourneyOverlay"><span>{String(active+1).padStart(2,'0')} / {String(steps.length).padStart(2,'0')}</span><strong>{steps[active]}</strong></div>
    </div>
    <div className="ctJourneyDetail" aria-live="polite"><span className="ctKicker">{label} {String(active+1).padStart(2,'0')}</span><h3>{steps[active]}</h3><p>{descriptions[locale][active]||''}</p><div className="ctJourneyActions"><button type="button" onClick={()=>setActive(i=>(i+steps.length-1)%steps.length)} aria-label={locale==='ar'?'المرحلة السابقة':'Previous stage'}>‹</button><button type="button" onClick={()=>setActive(i=>(i+1)%steps.length)} aria-label={locale==='ar'?'المرحلة التالية':'Next stage'}>›</button></div></div>
   </div>
   <div className="ctJourneyStages" role="group" aria-label={locale==='ar'?'اختر مرحلة المشروع':'Choose a project stage'}>
    {steps.map((step,index)=><button key={index} type="button" className={`ctJourneyStage ${active===index?'isActive':''}`} aria-pressed={active===index} onClick={()=>setActive(index)} onMouseEnter={()=>{if(!reduceMotion&&window.matchMedia('(hover:hover)').matches)setActive(index)}} onFocus={()=>setActive(index)}><span className="ctJourneyStageNumber">{String(index+1).padStart(2,'0')}</span><span className="ctJourneyStageText">{step}</span></button>)}
   </div>
  </div>
 </section>;
}
