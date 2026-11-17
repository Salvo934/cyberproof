import { Lock } from "lucide-react";
import { evidenceFileStorage } from "@/lib/persistence/evidence-file-storage";

/**
 * Spazio riservato al futuro caricamento sicuro dei file (Supabase Storage).
 * Volutamente senza controlli interattivi: finché l'archivio non esiste,
 * l'interfaccia non deve far credere che un file possa essere caricato.
 */
export function SecureUploadNotice() {
  if (evidenceFileStorage) return null;

  return (
    <div className="flex gap-3 rounded-lg border border-dashed bg-muted/30 px-3 py-3">
      <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="space-y-1 text-xs leading-5 text-muted-foreground">
        <p className="font-medium text-foreground">Caricamento file non disponibile in questa versione</p>
        <p>
          CyberProof registra solo i metadati dell&apos;evidenza e un riferimento al luogo in cui il
          documento è conservato. Nessun file viene salvato nel browser. L&apos;archiviazione sicura
          (bucket privato, accesso con link temporanei) è prevista con Supabase Storage.
        </p>
      </div>
    </div>
  );
}
