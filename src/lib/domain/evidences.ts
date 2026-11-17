import type { Evidence, EvidenceDocumentType } from "@/lib/models/types";

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

/** Evidenze ordinate dalla più recente alla meno recente. */
export function sortEvidencesByDate(evidences: Evidence[]): Evidence[] {
  return [...evidences].sort(
    (a, b) => b.collectedAt.localeCompare(a.collectedAt) || b.createdAt.localeCompare(a.createdAt),
  );
}
