import Link from 'next/link';
export default function AdminHome(){
 const sectors=[['contracting','المقاولات والتطوير العقاري','/admin/edit/contracting?page=root'],['industry','الصناعة والأخشاب','/admin/workspace?sector=industry'],['hospitality','الضيافة','/admin/workspace?sector=hospitality'],['administrative','الخدمات الإدارية','/admin/workspace?sector=administrative']];
 return <main dir="rtl" style={{maxWidth:1100,margin:'auto',padding:'32px 16px'}}>
  <h1>إدارة قطاعات بلوم المتحدة</h1><p>اختر القطاع لفتح صفحات الموقع للتحرير. الصفحة الرئيسية للمجموعة غير قابلة للتحرير.</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:18,marginTop:28}}>
   {sectors.map(([slug,title,href])=><Link key={slug} href={href} style={{padding:32,border:'1px solid #d1d5db',borderRadius:16,background:'white',display:'grid',gap:20,textDecoration:'none'}}><strong>{title}</strong><span>{slug==='contracting'?'افتح صفحات الموقع للتحرير ←':'المحرر قيد التجهيز'}</span></Link>)}
  </div>
 </main>;
}
