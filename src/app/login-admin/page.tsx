'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('reason') === 'not-admin') {
      setError('تم تسجيل الدخول، لكن هذا الحساب لا يملك صلاحية دخول لوحة الإدارة.');
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/public-config', { cache: 'no-store' });
      if (!response.ok) throw new Error('إعدادات اتصال Supabase غير متاحة على الخادم.');
      const config: { url?: string; key?: string } = await response.json();
      if (!config.url || !config.key) throw new Error('إعدادات اتصال Supabase غير مكتملة.');
      const db = createBrowserClient(config.url, config.key);
      const { data, error: authError } = await db.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      const userId = data.user?.id;
      if (!userId) throw new Error('تعذر التحقق من الحساب بعد تسجيل الدخول.');

      const { data: membership, error: membershipError } = await db
        .from('admin_memberships')
        .select('user_id')
        .eq('user_id', userId)
        .eq('active', true)
        .maybeSingle();
      if (membershipError) throw new Error('تعذر التحقق من صلاحيات الحساب. حاول مرة أخرى.');
      if (!membership) {
        const { error: signOutError } = await db.auth.signOut();
        if (signOutError) {
          throw new Error('هذا الحساب لا يملك صلاحية الإدارة، وتعذر إنهاء الجلسة. أعد المحاولة بعد التفعيل.');
        }
        throw new Error('بيانات الدخول صحيحة، لكن هذا الحساب غير مفعّل في لوحة الإدارة.');
      }

      window.location.href = '/admin/dashboard';
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بخدمة تسجيل الدخول.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="container page" dir="rtl">
    <h1>دخول الإدارة</h1>
    <form onSubmit={submit}>
      <label className="field">البريد الإلكتروني<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
      <label className="field">كلمة المرور<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
      <button className="action" disabled={busy}>{busy ? 'جارٍ التحقق...' : 'دخول'}</button>
      <p role="alert">{error}</p>
    </form>
  </main>;
}
