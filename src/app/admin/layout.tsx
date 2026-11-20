export const dynamic = 'force-dynamic';
import './admin-workspace.css';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { serverDb } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let db;
  try {
    db = await serverDb();
  } catch {
    return <main className="container page">تعذر الاتصال بإعدادات Supabase. تحقق من متغيرات البيئة.</main>;
  }

  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError) {
    return <main className="container page">تعذر التحقق من جلسة الدخول. أعد المحاولة بعد قليل.</main>;
  }
  if (!user) redirect('/login-admin');

  const { data: membership, error: membershipError } = await db
    .from('admin_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle();
  if (membershipError) {
    return <main className="container page">تعذر التحقق من صلاحيات لوحة الإدارة. أعد المحاولة بعد قليل.</main>;
  }
  if (!membership) redirect('/login-admin?reason=not-admin');

  return <div className="adminShell" dir="rtl">
    <aside className="adminAside">
      <div className="adminAsideBrand"><small>BLOM UNITED</small><h2>إدارة المحتوى</h2><p>مساحة عمل المجموعة</p></div>
      <div className="adminAsideLabel">مساحة العمل</div>
      <Link href="/admin/dashboard">لوحة الإدارة</Link>
      <Link href="/admin/workspace">مركز القطاعات</Link>
      <Link href="/admin/sectors">بيانات القطاعات</Link>
      <Link href="/admin/edit/contracting?page=root">محرر المقاولات</Link>
      <div className="adminAsideLabel">المشاريع والوسائط</div>
      <Link href="/admin/projects">إدارة المشاريع</Link>
      <Link href="/admin/visual">ربط صور القطاعات والمشاريع والخدمات</Link>
      <Link href="/admin/media">مكتبة الوسائط</Link>
      <div className="adminAsideFooter">لوحة إدارة المحتوى · الإصدار التجريبي</div>
    </aside>
    <main className="adminMain">{children}</main>
  </div>;
}