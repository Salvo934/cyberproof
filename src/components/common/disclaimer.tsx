import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Avviso metodologico: l'app è un supporto documentale, non una certificazione. */
export function Disclaimer({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="note"
      className={cn(
        "flex gap-2 rounded-lg border border-dashed px-3 py-2.5 text-xs leading-5 text-muted-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <p>
        {children ??
          "CyberProof è uno strumento di supporto documentale. Gli stati mostrati descrivono l'avanzamento della documentazione e non costituiscono una valutazione o certificazione di conformità alla normativa NIS2."}
      </p>
    </div>
  );
}
