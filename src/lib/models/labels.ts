import type {
  ControlCategory,
  ControlStatus,
  EvidenceDocumentType,
  ImplementationStatus,
  NIS2EntityClassification,
  RegulatorySource,
} from "./types";

/** Tono visivo semantico, mappato sui token di colore del design system. */
export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export const CONTROL_STATUSES: readonly ControlStatus[] = [
  "da_valutare",
  "in_lavorazione",
  "documentato",
  "da_verificare",
] as const;

export const CONTROL_STATUS_META: Record<
  ControlStatus,
  { label: string; description: string; tone: Tone }
> = {
  da_valutare: {
    label: "Da valutare",
    description: "Il controllo non è ancora stato analizzato.",
    tone: "neutral",
  },
  in_lavorazione: {
    label: "In lavorazione",
    description: "La documentazione è in corso di predisposizione.",
    tone: "info",
  },
  documentato: {
    label: "Documentato",
    description: "La documentazione del controllo è stata predisposta.",
    tone: "success",
  },
  da_verificare: {
    label: "Da verificare",
    description: "La documentazione richiede una revisione o una nuova verifica.",
    tone: "warning",
  },
};

export const IMPLEMENTATION_STATUSES: readonly ImplementationStatus[] = [
  "non_definita",
  "pianificata",
  "parziale",
  "attuata",
] as const;

export const IMPLEMENTATION_META: Record<
  ImplementationStatus,
  { label: string; tone: Tone }
> = {
  non_definita: { label: "Non definita", tone: "neutral" },
  pianificata: { label: "Pianificata", tone: "info" },
  parziale: { label: "Parziale", tone: "warning" },
  attuata: { label: "Attuata (dichiarata)", tone: "success" },
};

export const CONTROL_CATEGORIES: readonly ControlCategory[] = [
  "governance",
  "gestione_accessi",
  "backup_continuita",
  "logging_monitoraggio",
  "gestione_incidenti",
  "gestione_vulnerabilita",
  "formazione",
  "fornitori",
  "crittografia",
] as const;

export const CONTROL_CATEGORY_LABEL: Record<ControlCategory, string> = {
  governance: "Governance e rischio",
  gestione_accessi: "Gestione accessi",
  backup_continuita: "Backup e continuità",
  logging_monitoraggio: "Logging e monitoraggio",
  gestione_incidenti: "Gestione incidenti",
  gestione_vulnerabilita: "Gestione vulnerabilità",
  formazione: "Formazione e consapevolezza",
  fornitori: "Sicurezza dei fornitori",
  crittografia: "Crittografia",
};

export const EVIDENCE_DOCUMENT_TYPE_LABEL: Record<EvidenceDocumentType, string> =
  {
    policy: "Policy",
    procedura: "Procedura",
    registro: "Registro / log",
    report_tecnico: "Report tecnico",
    screenshot: "Screenshot / configurazione",
    verbale: "Verbale",
    attestato: "Attestato",
    contratto: "Contratto / accordo",
    altro: "Altro",
  };

export const REGULATORY_SOURCE_LABEL: Record<RegulatorySource, string> = {
  direttiva_ue_2022_2555: "Direttiva (UE) 2022/2555 (NIS2)",
  dlgs_138_2024: "D.Lgs. 138/2024",
  acn_misure_base: "ACN – Misure di sicurezza di base",
};

export const NIS2_CLASSIFICATION_LABEL: Record<NIS2EntityClassification, string> =
  {
    essenziale: "Soggetto essenziale",
    importante: "Soggetto importante",
    non_determinata: "Classificazione non determinata",
  };
