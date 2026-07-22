import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = async (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Auth is optional. Without Supabase credentials configured, pass the request
  // straight through — otherwise createServerClient throws and, because the
  // middleware matcher covers every path, that 500s the entire app.
  if (!supabaseUrl || !supabaseKey) return supabaseResponse;

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  );

  // Refresh the session (keeps cookies alive) but don't block access.
  // When Supabase isn't fully configured or the user hasn't signed in,
  // we still let them through so the app is usable for local dev / demo.
  try {
    await supabase.auth.getUser()
  } catch {
    // ignore — session refresh is best-effort
  }

  return supabaseResponse
};
