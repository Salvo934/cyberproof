"use client";

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
import { deleteControl } from "@/lib/domain/controls";
import type { SecurityControl } from "@/lib/models/types";
import { updateAppData } from "@/lib/store/app-store";

interface Props {
  control: SecurityControl | null;
  evidenceCount: number;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteControlDialog({ control, evidenceCount, onOpenChange, onDeleted }: Props) {
  return (
    <AlertDialog open={control !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare il controllo?</AlertDialogTitle>
          <AlertDialogDescription>
            {control && (
              <>
                Il controllo <strong className="font-medium text-foreground">{control.code} – {control.name}</strong>{" "}
                verrà rimosso dal registro
                {evidenceCount > 0
                  ? ` insieme a ${evidenceCount === 1 ? "1 evidenza collegata" : `${evidenceCount} evidenze collegate`}`
                  : ""}
                . L&apos;operazione non può essere annullata.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              if (!control) return;
              updateAppData((d) => deleteControl(d, control.id));
              toast.success(`Controllo ${control.code} eliminato`);
              onDeleted?.();
            }}
          >
            Elimina
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
