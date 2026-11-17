"use client";

import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FormField, fieldAria } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  EVIDENCE_LIMITS,
  emptyEvidenceInput,
  evidenceToInput,
  normalizeEvidenceInput,
  validateEvidenceInput,
  type EvidenceFieldErrors,
  type EvidenceInput,
} from "@/lib/domain/evidences";
import { EVIDENCE_DOCUMENT_TYPE_LABEL } from "@/lib/models/labels";
import type { Evidence, EvidenceDocumentType, SecurityControl } from "@/lib/models/types";
import {
  ACCEPT_ATTRIBUTE,
  EVIDENCE_UPLOAD_LIMITS,
  formatFileSize,
  validateEvidenceFile,
} from "@/lib/persistence/evidence-file-storage";
import { actionErrorMessage, appActions } from "@/lib/store/app-store";

const DOCUMENT_TYPES = Object.keys(EVIDENCE_DOCUMENT_TYPE_LABEL) as EvidenceDocumentType[];

interface EvidenceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  control: SecurityControl;
  /** Se presente, modifica questa evidenza; altrimenti ne registra una nuova. */
  evidence?: Evidence;
}

export function EvidenceFormDialog(props: EvidenceFormDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        {props.open && <EvidenceForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function EvidenceForm({ onOpenChange, control, evidence }: EvidenceFormDialogProps) {
  const isEdit = Boolean(evidence);
  const fileInput = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<EvidenceInput>(() =>
    evidence ? evidenceToInput(evidence) : emptyEvidenceInput(control.owner),
  );
  const [errors, setErrors] = useState<EvidenceFieldErrors>({});
  const [newFile, setNewFile] = useState<File | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const currentFile = evidence?.file && !removeExisting ? evidence.file : null;

  const set = <K extends keyof EvidenceInput>(key: K, value: EvidenceInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const invalid = validateEvidenceFile(file);
    setFileError(invalid ?? null);
    setNewFile(invalid ? null : file);
    if (fileInput.current) fileInput.current.value = "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const input = normalizeEvidenceInput(values);
    const validation = validateEvidenceInput(input);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setPending(true);
    try {
      if (evidence) {
        const fileChange = newFile
          ? ({ kind: "replace", file: newFile } as const)
          : removeExisting
            ? ({ kind: "remove" } as const)
            : ({ kind: "keep" } as const);
        await appActions.updateEvidence(evidence, input, fileChange);
        toast.success("Evidenza aggiornata");
      } else {
        await appActions.createEvidence(control.id, input, newFile);
        toast.success(newFile ? "Evidenza registrata e documento archiviato" : "Evidenza registrata");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(actionErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Modifica evidenza" : "Registra evidenza"}</DialogTitle>
        <DialogDescription>
          Per il controllo <span className="font-mono text-xs">{control.code}</span> – {control.name}.
        </DialogDescription>
      </DialogHeader>

      <FormField id="ev-title" label="Titolo" required error={errors.title}>
        <Input
          {...fieldAria("ev-title", errors.title)}
          placeholder="Es. Procedura di gestione dei backup v1.0"
          maxLength={EVIDENCE_LIMITS.title}
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </FormField>

      <FormField id="ev-description" label="Descrizione" error={errors.description}>
        <Textarea
          {...fieldAria("ev-description", errors.description)}
          rows={2}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="ev-type" label="Tipologia del documento" required>
          <Select value={values.documentType} onValueChange={(v) => set("documentType", v as EvidenceDocumentType)}>
            <SelectTrigger id="ev-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {EVIDENCE_DOCUMENT_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="ev-date" label="Data di raccolta" required error={errors.collectedAt}>
          <Input
            {...fieldAria("ev-date", errors.collectedAt)}
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={values.collectedAt}
            onChange={(e) => set("collectedAt", e.target.value)}
          />
        </FormField>
      </div>

      <FormField id="ev-owner" label="Responsabile" required error={errors.owner}>
        <Input {...fieldAria("ev-owner", errors.owner)} value={values.owner} onChange={(e) => set("owner", e.target.value)} />
      </FormField>

      <div className="space-y-1.5">
        <p className="text-sm font-medium">Documento</p>
        {newFile ? (
          <FileRow name={newFile.name} meta={`${formatFileSize(newFile.size)} · verrà archiviato al salvataggio`} onRemove={() => setNewFile(null)} />
        ) : currentFile ? (
          <FileRow
            name={currentFile.name}
            meta={`${formatFileSize(currentFile.sizeBytes)} · archiviato`}
            onRemove={() => setRemoveExisting(true)}
          />
        ) : null}
        <input
          ref={fileInput}
          id="ev-file"
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
          <Paperclip aria-hidden />
          {newFile || currentFile ? "Sostituisci file" : "Allega file"}
        </Button>
        {fileError ? (
          <p className="text-xs text-destructive">{fileError}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Facoltativo. {Object.values(EVIDENCE_UPLOAD_LIMITS.allowedMimeTypes).join(", ")}, max 20 MB. Archiviato in
            uno spazio privato accessibile solo alla tua organizzazione. Evita documenti con dati personali non necessari.
          </p>
        )}
      </div>

      <FormField
        id="ev-reference"
        label="Riferimento al documento"
        error={errors.referenceLocation}
        hint="In alternativa o in aggiunta al file: dove è conservato l'originale. Facoltativo."
      >
        <Input
          {...fieldAria("ev-reference", errors.referenceLocation)}
          className="font-mono text-xs"
          placeholder="Es. Repository documentale › ISMS/03-Procedure/Backup-v1.0"
          value={values.referenceLocation}
          onChange={(e) => set("referenceLocation", e.target.value)}
        />
      </FormField>

      <FormField id="ev-notes" label="Note" error={errors.notes}>
        <Textarea {...fieldAria("ev-notes", errors.notes)} rows={2} value={values.notes} onChange={(e) => set("notes", e.target.value)} />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
          Annulla
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {pending && newFile ? "Caricamento…" : isEdit ? "Salva modifiche" : "Registra evidenza"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function FileRow({ name, meta, onRemove }: { name: string; meta: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
      <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{name}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Rimuovi ${name}`} onClick={onRemove}>
        <X aria-hidden />
      </Button>
    </div>
  );
}
