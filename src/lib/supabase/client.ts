"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

let client: SupabaseClient | null = null;

/** Client Supabase per il browser (sessione salvata in cookie, condivisa con il proxy). */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!client) {
    const { url, key } = getSupabaseEnv();
    client = createBrowserClient(url, key);
  }
  return client;
}
