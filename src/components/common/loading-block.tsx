import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder mostrato finché i dati locali non sono stati letti dal browser. */
export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Caricamento dati">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
