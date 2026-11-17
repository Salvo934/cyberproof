"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SecurityControl } from "@/lib/models/types";
import { actionErrorMessage, appActions } from "@/lib/store/app-store";

interface Props {
  control: SecurityControl | null;
  evidenceCount: number;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteControlDialog({ control, evidenceCount, onOpenChange, onDeleted }: Props) {
  const [pending, setPending] = useState(false);

  const handleDelete = async (event: React.MouseEvent) => {
    // Il dialog resta aperto finché l'eliminazione non è confermata dal database.
    event.preventDefault();
    if (!control) return;
    setPending(true);
    try {
      await appActions.deleteControl(control.id);
      toast.success(`Controllo ${control.code} eliminato`);
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      toast.error(actionErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog open={control !== null} onOpenChange={(open) => !pending && onOpenChange(open)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare il controllo?</AlertDialogTitle>
          <AlertDialogDescription>
            {control && (
              <>
                Il controllo <strong className="font-medium text-foreground">{control.code} – {control.name}</strong>{" "}
                verrà rimosso dal registro
                {evidenceCount > 0
                  ? ` insieme a ${evidenceCount === 1 ? "1 evidenza collegata e al relativo documento archiviato" : `${evidenceCount} evidenze collegate e ai relativi documenti archiviati`}`
                  : ""}
                . L&apos;operazione non può essere annullata.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Annulla</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Elimina
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
