"use client";

import { DatabaseZap, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { actionErrorMessage, appActions } from "@/lib/store/app-store";

/** Carica i 10 controlli di esempio. Disponibile solo con il registro vuoto. */
export function LoadDemoButton({ variant = "outline" }: { variant?: "outline" | "default" }) {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    try {
      await appActions.loadDemoData();
      toast.success("Dati dimostrativi caricati");
    } catch (error) {
      toast.error(actionErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <Button size="sm" variant={variant} onClick={handleClick} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <DatabaseZap aria-hidden />}
      Carica dati demo
    </Button>
  );
}
