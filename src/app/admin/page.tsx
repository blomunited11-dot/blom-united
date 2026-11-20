import Link from 'next/link';

const sectors=[
 {name:'المقاولات والتطوير العقاري',english:'CONTRACTING & REAL ESTATE',href:'/admin/edit/contracting?page=root',ready:true,description:'تحرير النصوص والصور مباشرة، وحفظ المسودات ومعاينتها ونشرها.'},
 {name:'الصناعة والأخشاب',english:'INDUSTRY & WOOD',href:'/admin/workspace?sector=industry',ready:false,description:'عرض القطاع الحالي. أدوات التحرير المباشر لم تكتمل بعد.'},
 {name:'الضيافة',english:'HOSPITALITY',href:'/admin/workspace?sector=hospitality',ready:false,description:'عرض القطاع الحالي. أدوات التحرير المباشر لم تكتمل بعد.'},
 {name:'الخدمات الإدارية',english:'BUSINESS SERVICES',href:'/admin/workspace?sector=administrative',ready:false,description:'عرض القطاع الحالي. أدوات التحرير المباشر لم تكتمل بعد.'}
] as const;

export default function AdminHome(){
 return <main dir="rtl" style={{maxWidth:1180,margin:'0 auto',padding:'clamp(24px,5vw,64px) 20px',fontFamily:'inherit',color:'#182525'}}>
  <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:20,flexWrap:'wrap',paddingBottom:28,borderBottom:'1px solid #d9dfdd'}}>
   <div><span style={{fontSize:12,letterSpacing:2,color:'#637773',fontWeight:700}}>BLOM UNITED / CONTENT MANAGEMENT</span><h1 style={{fontSize:'clamp(28px,4vw,42px)',lineHeight:1.5,margin:'12px 0 8px',fontWeight:750}}>إدارة محتوى بلوم المتحدة</h1><p style={{fontSize:16,lineHeight:1.9,color:'#53635f',margin:0}}>اختر القطاع للعمل على محتواه. التعديلات لا تظهر للزوار إلا بعد النشر.</p></div>
   <Link href="/admin/dashboard" style={{background:'#203d36',color:'#fff',padding:'13px 20px',borderRadius:10,textDecoration:'none',fontWeight:700}}>عرض مؤشرات المحتوى ←</Link>
  </header>
  <section aria-label="القطاعات" style={{marginTop:34}}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:12,flexWrap:'wrap',marginBottom:18}}><h2 style={{fontSize:23,margin:0}}>قطاعات المجموعة</h2><span style={{color:'#697a75',fontSize:13}}>المحرر المباشر متاح حاليًا لقطاع المقاولات</span></div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,260px),1fr))',gap:16}}>
    {sectors.map((sector,index)=><article key={sector.english} style={{background:'#fff',border:'1px solid #dce3df',borderRadius:18,padding:25,display:'flex',flexDirection:'column',minHeight:265,boxShadow:'0 8px 30px rgba(24,45,39,.04)'}}>
     <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}><span style={{fontSize:13,color:'#71847d',fontWeight:700}}>0{index+1}</span><span style={{fontSize:12,padding:'6px 10px',borderRadius:20,background:sector.ready?'#e5f1e9':'#f0f2f1',color:sector.ready?'#24553d':'#66736f'}}>{sector.ready?'التحرير متاح':'التحرير قيد التجهيز'}</span></div>
     <h3 style={{fontSize:21,lineHeight:1.6,margin:'24px 0 2px'}}>{sector.name}</h3><span style={{fontSize:11,letterSpacing:1,color:'#82918b'}}>{sector.english}</span>
     <p style={{lineHeight:1.8,fontSize:14,color:'#60716a',margin:'14px 0 22px',flexGrow:1}}>{sector.description}</p>
     <Link href={sector.href} style={{display:'block',textAlign:'center',padding:'12px 15px',background:sector.ready?'#203d36':'#eef1ef',color:sector.ready?'#fff':'#344c42',borderRadius:10,textDecoration:'none',fontWeight:700}}>{sector.ready?'فتح المحرر المباشر ←':'عرض مساحة القطاع ←'}</Link>
    </article>)}
   </div>
  </section>
  <section style={{marginTop:30,padding:22,borderRadius:15,background:'#eef2f0',display:'flex',justifyContent:'space-between',gap:16,flexWrap:'wrap',alignItems:'center'}}>
   <div><h2 style={{fontSize:18,margin:'0 0 8px'}}>أدوات إدارة المحتوى</h2><p style={{margin:0,lineHeight:1.8,color:'#5b6c65'}}>إدارة المشاريع والصور، أو متابعة حالة المحتوى من لوحة المؤشرات.</p></div>
   <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><Link href="/admin/projects" style={{padding:'11px 16px',border:'1px solid #c5d1cb',borderRadius:9,color:'#203d36',textDecoration:'none',background:'#fff'}}>المشاريع</Link><Link href="/admin/media" style={{padding:'11px 16px',border:'1px solid #c5d1cb',borderRadius:9,color:'#203d36',textDecoration:'none',background:'#fff'}}>مكتبة الصور</Link></div>
  </section>
 </main>;
}
