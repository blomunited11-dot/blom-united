import { NextResponse } from 'next/server';
import { getSupabasePublicConfig } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { url, key } = await getSupabasePublicConfig();
    return NextResponse.json({ url, key }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json(
      { error: 'Supabase public configuration is unavailable at runtime' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
