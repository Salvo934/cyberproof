/**
 * Modello dati di CyberProof.
 *
 * Nota metodologica: il modello separa volutamente quattro concetti distinti,
 * che non devono essere confusi né aggregati in un unico "punteggio":
 *
 * 1. Stato della documentazione  → `SecurityControl.status`
 * 2. Implementazione della misura → `SecurityControl.implementation` (dichiarata)
 * 3. Verifica dell'efficacia      → `SecurityControl.lastVerifiedAt` (+ evidenze)
 * 4. Conformità normativa         → NON calcolata dall'applicazione
 */

/** Data in formato ISO `YYYY-MM-DD`. */
export type ISODate = string;

/** Data e ora in formato ISO 8601. */
export type ISODateTime = string;

/** Stato del processo di documentazione di un controllo. */
export type ControlStatus =
  | "da_valutare"
  | "in_lavorazione"
  | "documentato"
  | "da_verificare";

/** Stato di attuazione della misura, così come dichiarato dal responsabile. */
export type ImplementationStatus =
  | "non_definita"
  | "pianificata"
  | "parziale"
  | "attuata";

export type ControlCategory =
  | "governance"
  | "gestione_accessi"
  | "backup_continuita"
  | "logging_monitoraggio"
  | "gestione_incidenti"
  | "gestione_vulnerabilita"
  | "formazione"
  | "fornitori"
  | "crittografia";

/** Fonti normative supportate. DORA è una futura estensione, non gestita nell'MVP. */
export type RegulatorySource =
  | "direttiva_ue_2022_2555"
  | "dlgs_138_2024"
  | "acn_misure_base";

export interface RegulatoryReference {
  source: RegulatorySource;
  /** Articolo / paragrafo / lettera, es. "Art. 21, par. 2, lett. c)". */
  article: string;
  /** Sintesi descrittiva del riferimento (non testo ufficiale). */
  summary?: string;
}

export type NIS2EntityClassification =
  | "essenziale"
  | "importante"
  | "non_determinata";

export interface Organization {
  id: string;
  name: string;
  sector: string;
  /** Classificazione NIS2 dichiarata: l'app non la determina. */
  nis2Classification: NIS2EntityClassification;
  /** Indica che l'organizzazione è fittizia (dati dimostrativi). */
  isDemo: boolean;
}

export interface SecurityControl {
  id: string;
  /** Identificativo leggibile, es. "CP-ACC-01". */
  code: string;
  name: string;
  category: ControlCategory;
  description: string;
  regulatoryReferences: RegulatoryReference[];
  status: ControlStatus;
  implementation: ImplementationStatus;
  owner: string;
  /** Data dell'ultima verifica di efficacia; `null` se mai verificato. */
  lastVerifiedAt: ISODate | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type EvidenceDocumentType =
  | "policy"
  | "procedura"
  | "registro"
  | "report_tecnico"
  | "screenshot"
  | "verbale"
  | "attestato"
  | "contratto"
  | "altro";

/**
 * Collegamento al documento di evidenza.
 *
 * Nell'MVP è ammesso solo un riferimento testuale a dove il documento è
 * conservato (es. percorso su repository documentale). Nessun file viene
 * salvato nel browser. Una futura variante `{ kind: "supabase_storage" }`
 * rappresenterà un file effettivamente archiviato in modo sicuro.
 */
export interface EvidenceLocationReference {
  kind: "riferimento_esterno";
  location: string;
}

export interface Evidence {
  id: string;
  controlId: string;
  title: string;
  description: string;
  documentType: EvidenceDocumentType;
  collectedAt: ISODate;
  owner: string;
  notes: string;
  reference: EvidenceLocationReference | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** Stato complessivo persistito dell'applicazione. */
export interface AppData {
  schemaVersion: 1;
  organization: Organization;
  controls: SecurityControl[];
  evidences: Evidence[];
}
