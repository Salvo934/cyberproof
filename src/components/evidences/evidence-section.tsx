"use client";

import { Download, FileText, FolderOpen, Link2, Loader2, Lock, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sortEvidencesByDate } from "@/lib/domain/evidences";
import { formatDate } from "@/lib/format";
import { EVIDENCE_DOCUMENT_TYPE_LABEL } from "@/lib/models/labels";
import type { Evidence, SecurityControl } from "@/lib/models/types";
import { formatFileSize, getEvidenceFileUrl } from "@/lib/persistence/evidence-file-storage";
import { actionErrorMessage, appActions } from "@/lib/store/app-store";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { EvidenceFormDialog } from "./evidence-form-dialog";

interface EvidenceSectionProps {
  control: SecurityControl;
  evidences: Evidence[];
}

export function EvidenceSection({ control, evidences }: EvidenceSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Evidence | undefined>();
  const [deleting, setDeleting] = useState<Evidence | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);

  const openFile = async (evidence: Evidence) => {
    if (!evidence.file) return;
    // La finestra va aperta subito (gesto dell'utente), poi riceve l'URL firmato.
    const win = window.open("about:blank", "_blank");
    setOpening(evidence.id);
    try {
      const url = await getEvidenceFileUrl(getSupabaseBrowserClient(), evidence.file.path);
      if (win) {
        win.opener = null;
        win.location.href = url;
      } else {
        window.location.assign(url);
      }
    } catch (error) {
      win?.close();
      toast.error(actionErrorMessage(error));
    } finally {
      setOpening(null);
    }
  };

  const confirmDelete = async (event: React.MouseEvent) => {
    event.preventDefault();
    if (!deleting) return;
    setDeletePending(true);
    try {
      await appActions.deleteEvidence(deleting);
      toast.success("Evidenza eliminata");
      setDeleting(null);
    } catch (error) {
      toast.error(actionErrorMessage(error));
    } finally {
      setDeletePending(false);
    }
  };

  const sorted = sortEvidencesByDate(evidences);

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  return (
    <section className="mt-8" aria-labelledby="evidences-heading">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 id="evidences-heading" className="text-sm font-semibold">
            Evidenze <span className="font-normal text-muted-foreground">({evidences.length})</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Documenti che attestano l&apos;attuazione o la verifica del controllo.
          </p>
        </div>
        {evidences.length > 0 && (
          <Button size="sm" variant="outline" onClick={openCreate}>
            <Plus aria-hidden /> Registra evidenza
          </Button>
        )}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Nessuna evidenza registrata"
          description="Registra un documento che dimostri come il controllo è applicato, ad esempio una policy, una procedura o un report."
        >
          <Button size="sm" onClick={openCreate}>
            <Plus aria-hidden /> Registra evidenza
          </Button>
        </EmptyState>
      ) : (
        <ul className="divide-y rounded-xl border">
          {sorted.map((evidence) => (
            <li key={evidence.id} className="flex gap-3 px-4 py-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                <FileText className="size-4 text-muted-foreground" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="text-sm font-medium">{evidence.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {EVIDENCE_DOCUMENT_TYPE_LABEL[evidence.documentType]} · {formatDate(evidence.collectedAt)} ·{" "}
                    {evidence.owner}
                  </span>
                </div>
                {evidence.description && <p className="text-xs text-muted-foreground">{evidence.description}</p>}
                {evidence.file && (
                  <button
                    type="button"
                    onClick={() => openFile(evidence)}
                    disabled={opening === evidence.id}
                    className="flex max-w-full items-center gap-1.5 rounded text-xs font-medium underline-offset-4 outline-none hover:underline focus-visible:underline disabled:opacity-60"
                    title={`SHA-256: ${evidence.file.sha256}`}
                  >
                    {opening === evidence.id ? (
                      <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden />
                    ) : (
                      <Lock className="size-3 shrink-0 text-success" aria-hidden />
                    )}
                    <span className="truncate">{evidence.file.name}</span>
                    <span className="shrink-0 font-normal text-muted-foreground">
                      {formatFileSize(evidence.file.sizeBytes)}
                    </span>
                    <Download className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                )}
                {evidence.reference && (
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Link2 className="size-3 shrink-0" aria-hidden />
                    <span className="truncate font-mono" title={evidence.reference.location}>
                      {evidence.reference.location}
                    </span>
                  </p>
                )}
                {!evidence.file && !evidence.reference && (
                  <p className="text-[11px] text-warning">Nessun documento allegato né riferimento indicato.</p>
                )}
                {evidence.notes && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">Note:</span> {evidence.notes}
                  </p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Azioni per l'evidenza ${evidence.title}`}>
                    <MoreHorizontal aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => {
                      setEditing(evidence);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil aria-hidden /> Modifica
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(evidence)}>
                    <Trash2 aria-hidden /> Elimina
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      <EvidenceFormDialog open={formOpen} onOpenChange={setFormOpen} control={control} evidence={editing} />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && !deletePending && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare l&apos;evidenza?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && (
                <>
                  L&apos;evidenza <strong className="font-medium text-foreground">{deleting.title}</strong> verrà
                  rimossa dal controllo
                  {deleting.file
                    ? " e il documento archiviato verrà cancellato definitivamente."
                    : ". Il documento originale, ovunque sia conservato, non viene modificato."}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Annulla</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={deletePending}>
              {deletePending && <Loader2 className="animate-spin" aria-hidden />}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
