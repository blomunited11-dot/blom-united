'use client';
import {useEffect,useState} from 'react';

/** Uses the viewer's local timezone; never the build/server timezone. */
export default function LocalClockHands(){
 const [now,setNow]=useState<Date|null>(null);
 useEffect(()=>{
  const update=()=>setNow(new Date());
  update();
  const timer=window.setInterval(update,250);
  return ()=>window.clearInterval(timer);
 },[]);
 const seconds=now?now.getSeconds()+now.getMilliseconds()/1000:0;
 const minutes=now?now.getMinutes()+seconds/60:0;
 const hours=now?(now.getHours()%12)+minutes/60:0;
 return <svg className="blomClockOverlay" viewBox="0 0 100 100" aria-label={now?`Local time: ${now.toLocaleTimeString()}`:'Clock'} role="img" style={{position:'absolute',left:'35.2%',top:'31.7%',width:'5.2%',height:'5.2%',overflow:'visible',pointerEvents:'none'}}>
  <circle cx="50" cy="50" r="48" fill="#087340" stroke="#d9b968" strokeWidth="4"/>
  {Array.from({length:12},(_,i)=><line key={i} x1="50" y1="10" x2="50" y2="19" stroke="#fff9d9" strokeWidth="3" transform={`rotate(${i*30} 50 50)`}/>)}
  <g transform={`rotate(${hours*30} 50 50)`}><path d="M50 58 L50 30" stroke="#fff" strokeWidth="5" strokeLinecap="round"/></g>
  <g transform={`rotate(${minutes*6} 50 50)`}><path d="M50 60 L50 20" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"/></g>
  <g transform={`rotate(${seconds*6} 50 50)`}><path d="M50 63 L50 10" stroke="#ff554c" strokeWidth="2.5" strokeLinecap="round"/></g>
  <circle cx="50" cy="50" r="5" fill="#f9e7b1"/>
 </svg>;
}
