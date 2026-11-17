import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";

export const metadata: Metadata = { title: "Configurazione" };

/** Mostrata quando mancano le variabili d'ambiente di Supabase. */
export default function SetupPage() {
  return (
    <AuthCard
      title="Configurazione richiesta"
      description="CyberProof non è ancora collegato a un progetto Supabase."
    >
      <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
        <li>Crea un progetto su supabase.com.</li>
        <li>
          Esegui lo script <code className="font-mono text-xs text-foreground">supabase/migrations/0001_init.sql</code> nel
          SQL Editor.
        </li>
        <li>
          Copia <code className="font-mono text-xs text-foreground">.env.example</code> in{" "}
          <code className="font-mono text-xs text-foreground">.env.local</code> e inserisci URL e publishable key.
        </li>
        <li>Riavvia il server di sviluppo.</li>
      </ol>
    </AuthCard>
  );
}
