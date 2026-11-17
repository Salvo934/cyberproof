import type {
  AppData,
  ControlCategory,
  ControlStatus,
  ImplementationStatus,
  RegulatoryReference,
  SecurityControl,
} from "@/lib/models/types";

/** Dati modificabili di un controllo (id e timestamp sono gestiti dall'app). */
export interface ControlInput {
  code: string;
  name: string;
  category: ControlCategory;
  description: string;
  regulatoryReferences: RegulatoryReference[];
  status: ControlStatus;
  implementation: ImplementationStatus;
  owner: string;
  lastVerifiedAt: string | null;
}

export type ControlFieldErrors = Partial<Record<keyof ControlInput, string>>;

const CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{1,23}$/;

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Normalizza l'input: spazi, codice maiuscolo, riferimenti vuoti rimossi. */
export function normalizeControlInput(input: ControlInput): ControlInput {
  return {
    ...input,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    description: input.description.trim(),
    owner: input.owner.trim(),
    lastVerifiedAt: input.lastVerifiedAt?.trim() || null,
    regulatoryReferences: input.regulatoryReferences
      .map((r) => ({
        source: r.source,
        article: r.article.trim(),
        ...(r.summary?.trim() ? { summary: r.summary.trim() } : {}),
      }))
      .filter((r) => r.article.length > 0),
  };
}

/** Valida un input già normalizzato. `currentId` esclude il controllo stesso dal controllo di unicità. */
export function validateControlInput(
  input: ControlInput,
  existing: SecurityControl[],
  currentId?: string,
): ControlFieldErrors {
  const errors: ControlFieldErrors = {};

  if (!input.code) errors.code = "Inserisci un ID controllo.";
  else if (!CODE_PATTERN.test(input.code))
    errors.code = "Usa solo lettere maiuscole, numeri e trattini (es. CP-ACC-03).";
  else if (existing.some((c) => c.code === input.code && c.id !== currentId))
    errors.code = "Esiste già un controllo con questo ID.";

  if (!input.name) errors.name = "Inserisci il nome del controllo.";
  else if (input.name.length > 120) errors.name = "Massimo 120 caratteri.";

  if (input.description.length > 1000) errors.description = "Massimo 1000 caratteri.";

  if (!input.owner) errors.owner = "Indica un responsabile.";

  if (input.lastVerifiedAt) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.lastVerifiedAt))
      errors.lastVerifiedAt = "Data non valida.";
    else if (input.lastVerifiedAt > todayISO())
      errors.lastVerifiedAt = "La data di verifica non può essere futura.";
  }

  return errors;
}

export function createControl(data: AppData, input: ControlInput): { data: AppData; control: SecurityControl } {
  const now = new Date().toISOString();
  const control: SecurityControl = { ...input, id: newId("ctrl"), createdAt: now, updatedAt: now };
  return { data: { ...data, controls: [...data.controls, control] }, control };
}

export function updateControl(data: AppData, id: string, input: ControlInput): AppData {
  const now = new Date().toISOString();
  return {
    ...data,
    controls: data.controls.map((c) => (c.id === id ? { ...c, ...input, updatedAt: now } : c)),
  };
}

export function updateControlStatus(data: AppData, id: string, status: ControlStatus): AppData {
  const now = new Date().toISOString();
  return {
    ...data,
    controls: data.controls.map((c) => (c.id === id ? { ...c, status, updatedAt: now } : c)),
  };
}

/** Elimina il controllo e le evidenze collegate, per non lasciare dati orfani. */
export function deleteControl(data: AppData, id: string): AppData {
  return {
    ...data,
    controls: data.controls.filter((c) => c.id !== id),
    evidences: data.evidences.filter((e) => e.controlId !== id),
  };
}

export function controlToInput(control: SecurityControl): ControlInput {
  return {
    code: control.code,
    name: control.name,
    category: control.category,
    description: control.description,
    regulatoryReferences: control.regulatoryReferences.map((r) => ({ ...r })),
    status: control.status,
    implementation: control.implementation,
    owner: control.owner,
    lastVerifiedAt: control.lastVerifiedAt,
  };
}

export const EMPTY_CONTROL_INPUT: ControlInput = {
  code: "",
  name: "",
  category: "governance",
  description: "",
  regulatoryReferences: [],
  status: "da_valutare",
  implementation: "non_definita",
  owner: "",
  lastVerifiedAt: null,
};

/** Suggerisce il prossimo codice libero, es. "CP-CTL-11". */
export function suggestControlCode(existing: SecurityControl[]): string {
  const codes = new Set(existing.map((c) => c.code));
  let n = existing.length + 1;
  let code = `CP-CTL-${String(n).padStart(2, "0")}`;
  while (codes.has(code)) {
    n += 1;
    code = `CP-CTL-${String(n).padStart(2, "0")}`;
  }
  return code;
}
