'use client';
import {useEffect,useState} from 'react';

function riyadhTime(){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Riyadh',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
 const get=(type:string)=>Number(parts.find(part=>part.type===type)?.value||0);
 return {hour:get('hour'),minute:get('minute'),second:get('second')};
}

export default function BlomClock(){
 const [time,setTime]=useState<{hour:number;minute:number;second:number}|null>(null);
 useEffect(()=>{
  const sync=()=>setTime(riyadhTime());
  sync();
  const interval=window.setInterval(sync,1000);
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('focus',sync);
  return ()=>{window.clearInterval(interval);document.removeEventListener('visibilitychange',sync);window.removeEventListener('focus',sync);};
 },[]);
 const seconds=time?.second||0;
 const minutes=(time?.minute||0)+seconds/60;
 const hours=((time?.hour||0)%12)+minutes/60;
 return <svg className="blomClockOverlay" viewBox="0 0 100 100" aria-hidden="true" focusable="false" style={{position:'absolute',left:'35.2%',top:'31.7%',width:'5.2%',height:'5.2%',overflow:'visible',pointerEvents:'none'}}>
  <circle cx="50" cy="50" r="48" fill="#087340" stroke="#d9b968" strokeWidth="4"/>
  {Array.from({length:12},(_,i)=><line key={i} x1="50" y1="10" x2="50" y2="19" stroke="#fff9d9" strokeWidth="3" transform={`rotate(${i*30} 50 50)`}/>)}
  <g transform={`rotate(${hours*30} 50 50)`}><path d="M50 50 L50 30" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round"/></g>
  <g transform={`rotate(${minutes*6} 50 50)`}><path d="M50 50 L50 17" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round"/></g>
  <g transform={`rotate(${seconds*6} 50 50)`}><path d="M50 63 L50 10" stroke="#ff554c" strokeWidth="3.3" strokeLinecap="round"/></g>
  <circle cx="50" cy="50" r="5" fill="#f9e7b1"/>
 </svg>;
}
