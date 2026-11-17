import type { AppData, Evidence, EvidenceDocumentType } from "@/lib/models/types";
import { newId } from "./controls";

/** Dati modificabili di un'evidenza (id, controllo e timestamp gestiti dall'app). */
export interface EvidenceInput {
  title: string;
  description: string;
  documentType: EvidenceDocumentType;
  collectedAt: string;
  owner: string;
  notes: string;
  /** Riferimento testuale al luogo in cui il documento è conservato; vuoto = nessun riferimento. */
  referenceLocation: string;
}

export type EvidenceFieldErrors = Partial<Record<keyof EvidenceInput, string>>;

export const EVIDENCE_LIMITS = {
  title: 120,
  description: 1000,
  notes: 1000,
  referenceLocation: 300,
} as const;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function emptyEvidenceInput(owner = ""): EvidenceInput {
  return {
    title: "",
    description: "",
    documentType: "policy",
    collectedAt: todayISO(),
    owner,
    notes: "",
    referenceLocation: "",
  };
}

export function evidenceToInput(evidence: Evidence): EvidenceInput {
  return {
    title: evidence.title,
    description: evidence.description,
    documentType: evidence.documentType,
    collectedAt: evidence.collectedAt,
    owner: evidence.owner,
    notes: evidence.notes,
    referenceLocation: evidence.reference?.location ?? "",
  };
}

export function normalizeEvidenceInput(input: EvidenceInput): EvidenceInput {
  return {
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    collectedAt: input.collectedAt.trim(),
    owner: input.owner.trim(),
    notes: input.notes.trim(),
    referenceLocation: input.referenceLocation.trim(),
  };
}

export function validateEvidenceInput(input: EvidenceInput): EvidenceFieldErrors {
  const errors: EvidenceFieldErrors = {};

  if (!input.title) errors.title = "Inserisci un titolo.";
  else if (input.title.length > EVIDENCE_LIMITS.title) errors.title = `Massimo ${EVIDENCE_LIMITS.title} caratteri.`;

  if (input.description.length > EVIDENCE_LIMITS.description)
    errors.description = `Massimo ${EVIDENCE_LIMITS.description} caratteri.`;

  if (input.notes.length > EVIDENCE_LIMITS.notes) errors.notes = `Massimo ${EVIDENCE_LIMITS.notes} caratteri.`;

  if (!input.collectedAt) errors.collectedAt = "Indica la data di raccolta.";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(input.collectedAt)) errors.collectedAt = "Data non valida.";
  else if (input.collectedAt > todayISO()) errors.collectedAt = "La data di raccolta non può essere futura.";

  if (!input.owner) errors.owner = "Indica un responsabile.";

  // Il riferimento è solo un'indicazione di dove si trova il documento:
  // non deve mai contenere il documento stesso (es. data URI o testo incollato).
  if (input.referenceLocation.length > EVIDENCE_LIMITS.referenceLocation)
    errors.referenceLocation = `Massimo ${EVIDENCE_LIMITS.referenceLocation} caratteri: inserisci solo il percorso o il nome del documento.`;
  else if (/^data:/i.test(input.referenceLocation))
    errors.referenceLocation = "Non è possibile incorporare file: indica solo dove è conservato il documento.";
  else if (/:\/\/[^/\s]*@/.test(input.referenceLocation))
    errors.referenceLocation = "Il collegamento non deve contenere credenziali.";

  return errors;
}

function toEvidenceFields(input: EvidenceInput): Omit<Evidence, "id" | "controlId" | "createdAt" | "updatedAt"> {
  const { referenceLocation, ...rest } = input;
  return {
    ...rest,
    reference: referenceLocation ? { kind: "riferimento_esterno", location: referenceLocation } : null,
  };
}

export function createEvidence(data: AppData, controlId: string, input: EvidenceInput): AppData {
  if (!data.controls.some((c) => c.id === controlId)) {
    throw new Error(`Controllo inesistente: ${controlId}`);
  }
  const now = new Date().toISOString();
  const evidence: Evidence = {
    ...toEvidenceFields(input),
    id: newId("evd"),
    controlId,
    createdAt: now,
    updatedAt: now,
  };
  return { ...data, evidences: [...data.evidences, evidence] };
}

export function updateEvidence(data: AppData, id: string, input: EvidenceInput): AppData {
  const now = new Date().toISOString();
  return {
    ...data,
    evidences: data.evidences.map((e) => (e.id === id ? { ...e, ...toEvidenceFields(input), updatedAt: now } : e)),
  };
}

export function deleteEvidence(data: AppData, id: string): AppData {
  return { ...data, evidences: data.evidences.filter((e) => e.id !== id) };
}

/** Evidenze ordinate dalla più recente alla meno recente. */
export function sortEvidencesByDate(evidences: Evidence[]): Evidence[] {
  return [...evidences].sort(
    (a, b) => b.collectedAt.localeCompare(a.collectedAt) || b.createdAt.localeCompare(a.createdAt),
  );
}
