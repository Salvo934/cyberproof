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
 * Riferimento testuale al luogo in cui l'organizzazione conserva il documento
 * (es. percorso su repository documentale), alternativo o complementare al file.
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
  /** File archiviato nel bucket privato; `null` se l'evidenza è solo un riferimento. */
  file: StoredEvidenceFile | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** Metadati di un documento archiviato in modo sicuro (Supabase Storage). */
export interface StoredEvidenceFile {
  /** Percorso nel bucket: `{organizationId}/{controlId}/{evidenceId}/{nomeFile}`. */
  path: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  /** Impronta SHA-256 calcolata al caricamento, per verificarne l'integrità. */
  sha256: string;
  uploadedAt: ISODateTime;
}

/** Dati dell'organizzazione dell'utente, caricati dal database. */
export interface AppData {
  organization: Organization;
  controls: SecurityControl[];
  evidences: Evidence[];
}
