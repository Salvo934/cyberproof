"use client";

import { CloudOff, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { appActions, useAppStore } from "@/lib/store/app-store";

/** Se il caricamento dei dati fallisce, mostra l'errore con le azioni possibili invece di un caricamento infinito. */
export function DataGate({ children }: { children: React.ReactNode }) {
  const { status, error } = useAppStore();
  const router = useRouter();

  if (status !== "error") return <>{children}</>;

  return (
    <EmptyState icon={CloudOff} title="Impossibile caricare i dati" description={error ?? "Errore sconosciuto."}>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" onClick={() => void appActions.reload()}>
          <RotateCw aria-hidden /> Riprova
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await appActions.signOut();
            router.replace("/login");
          }}
        >
          Esci e accedi di nuovo
        </Button>
      </div>
    </EmptyState>
  );
}
