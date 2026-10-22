import { createBrowserClient } from '@supabase/ssr';
import { Database } from './types';

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes('placeholder') &&
    !url.includes('your-project-ref') &&
    !key.includes('placeholder') &&
    !key.includes('your-anon-key')
  );
}

/**
 * Creates or returns the singleton Supabase browser client
 */
export function createClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-anon-key';

  client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return client;
}
