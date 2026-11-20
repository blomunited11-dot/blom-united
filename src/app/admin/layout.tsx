export const dynamic='force-dynamic';
import {redirect} from 'next/navigation';
import {serverDb} from '@/lib/supabase/server';
export default async function AdminLayout({children}:{children:React.ReactNode}){
 let db;try{db=await serverDb()}catch{return <main>تعذر الاتصال بإعدادات Supabase.</main>}
 const {data:{user},error}=await db.auth.getUser();
 if(error)return <main>تعذر التحقق من جلسة الدخول.</main>;
 if(!user)redirect('/login-admin');
 const {data:membership,error:membershipError}=await db.from('admin_memberships').select('role').eq('user_id',user.id).eq('active',true).maybeSingle();
 if(membershipError)return <main>تعذر التحقق من صلاحيات الإدارة.</main>;
 if(!membership)redirect('/login-admin?reason=not-admin');
 return <div style={{minHeight:'100vh',background:'#f8fafc'}}>{children}</div>;
}
