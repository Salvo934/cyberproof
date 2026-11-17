import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Nessuna cache incrementale lato server: i dati dell'app vengono letti nel
// browser da Supabase (con RLS), quindi non serve un bucket R2 per l'ISR.
export default defineCloudflareConfig({});
