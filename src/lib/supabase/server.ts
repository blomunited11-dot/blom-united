import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabasePublicConfig } from './config';

export async function serverDb() {
  const { url, key } = await getSupabasePublicConfig();

  const jar = await cookies();
  type CookieSetOptions = Parameters<typeof jar.set>[2];
  type CookieToSet = { name: string; value: string; options?: CookieSetOptions };

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(values: CookieToSet[]) {
        try {
          values.forEach(({ name, value, options }) => {
            jar.set(name, value, options);
          });
        } catch {
          // Cookie writes can be unavailable in Server Components.
        }
      },
    },
  });
}
