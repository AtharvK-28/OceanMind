import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Browser Supabase client, or null when the project isn't configured.
 * Auth is optional here — returning null lets callers skip it, instead of
 * createBrowserClient throwing during hydration and blanking the page.
 */
export const createClient = () =>
  supabaseUrl && supabaseKey ? createBrowserClient(supabaseUrl, supabaseKey) : null;
