"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null | undefined;

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = publishableKey || anonKey;

  if (!url || !key) {
    if (typeof window !== "undefined") {
      console.warn(
        "Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local to enable authentication."
      );
    }
    return null;
  }

  return { url, key };
}

export function getSupabaseBrowserClient() {
  if (browserClient !== undefined) return browserClient;

  const env = getSupabaseEnv();
  if (!env) {
    browserClient = null;
    return browserClient;
  }

  browserClient = createBrowserClient(env.url, env.key);
  return browserClient;
}
