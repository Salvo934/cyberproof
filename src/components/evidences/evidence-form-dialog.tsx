"use client";

import { useState } from "react";
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
  createEvidence,
  emptyEvidenceInput,
  evidenceToInput,
  normalizeEvidenceInput,
  updateEvidence,
  validateEvidenceInput,
  type EvidenceFieldErrors,
  type EvidenceInput,
} from "@/lib/domain/evidences";
import { EVIDENCE_DOCUMENT_TYPE_LABEL } from "@/lib/models/labels";
import type { Evidence, EvidenceDocumentType, SecurityControl } from "@/lib/models/types";
import { updateAppData } from "@/lib/store/app-store";
import { SecureUploadNotice } from "./secure-upload-notice";

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
  const [values, setValues] = useState<EvidenceInput>(() =>
    evidence ? evidenceToInput(evidence) : emptyEvidenceInput(control.owner),
  );
  const [errors, setErrors] = useState<EvidenceFieldErrors>({});

  const set = <K extends keyof EvidenceInput>(key: K, value: EvidenceInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const input = normalizeEvidenceInput(values);
    const validation = validateEvidenceInput(input);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    if (evidence) {
      updateAppData((d) => updateEvidence(d, evidence.id, input));
      toast.success("Evidenza aggiornata");
    } else {
      updateAppData((d) => createEvidence(d, control.id, input));
      toast.success("Evidenza registrata");
    }
    onOpenChange(false);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Modifica evidenza" : "Registra evidenza"}</DialogTitle>
        <DialogDescription>
          Per il controllo <span className="font-mono text-xs">{control.code}</span> – {control.name}.
          Non inserire dati personali o informazioni riservate nei campi di testo.
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
        <Input
          {...fieldAria("ev-owner", errors.owner)}
          value={values.owner}
          onChange={(e) => set("owner", e.target.value)}
        />
      </FormField>

      <FormField
        id="ev-reference"
        label="Riferimento al documento"
        error={errors.referenceLocation}
        hint="Dove è conservato il documento, es. percorso nel repository documentale. Facoltativo."
      >
        <Input
          {...fieldAria("ev-reference", errors.referenceLocation)}
          className="font-mono text-xs"
          placeholder="Es. Repository documentale › ISMS/03-Procedure/Backup-v1.0"
          value={values.referenceLocation}
          onChange={(e) => set("referenceLocation", e.target.value)}
        />
      </FormField>

      <SecureUploadNotice />

      <FormField id="ev-notes" label="Note" error={errors.notes}>
        <Textarea
          {...fieldAria("ev-notes", errors.notes)}
          rows={2}
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Annulla
        </Button>
        <Button type="submit">{isEdit ? "Salva modifiche" : "Registra evidenza"}</Button>
      </DialogFooter>
    </form>
  );
}
