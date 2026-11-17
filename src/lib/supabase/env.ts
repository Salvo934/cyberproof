/**
 * Configurazione pubblica di Supabase. Le variabili NEXT_PUBLIC_* finiscono nel
 * bundle del browser: qui va solo la chiave "publishable" (o la legacy "anon"),
 * mai la service role key. La sicurezza dei dati è garantita dalle policy RLS.
 */
export function getSupabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Configurazione Supabase mancante: imposta NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local (vedi .env.example).",
    );
  }
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
