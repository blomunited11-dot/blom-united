import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function getSupabasePublicConfig() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    try {
      const { env } = await getCloudflareContext({ async: true });
      const bindings = env as unknown as Record<string, string | undefined>;
      url ||= bindings.NEXT_PUBLIC_SUPABASE_URL;
      key ||= bindings.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } catch {
      // Outside the Cloudflare runtime, use ordinary process environment.
    }
  }
  if (!url || !key) throw new Error('Supabase public configuration is missing');
  return { url, key };
}
