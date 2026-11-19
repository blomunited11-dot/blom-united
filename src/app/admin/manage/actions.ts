'use server';

import { revalidatePath } from 'next/cache';
import { serverDb } from '@/lib/supabase/server';
import { parseManagedEntryUpdate } from './validation';

export async function updateManagedEntry(form: FormData) {
  const input = parseManagedEntryUpdate(form);
  const db = await serverDb();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) throw new Error('Authentication required');

  const { data: member, error: memberError } = await db
    .from('admin_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle();
  if (memberError || member?.role !== 'owner') throw new Error('Owner permission required');

  const { error } = await db.rpc('update_managed_entry', input);
  if (error) throw new Error(error.message);

  revalidatePath('/admin');
  revalidatePath(`/admin/${input.p_table}`);
  revalidatePath('/ar', 'layout');
  revalidatePath('/en', 'layout');
}
