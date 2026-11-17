/**
 * Contratto per il futuro archivio sicuro dei documenti di evidenza.
 *
 * NON implementato nell'MVP: CyberProof non carica né conserva file.
 * Le evidenze contengono solo un riferimento testuale al luogo in cui il
 * documento è custodito dall'organizzazione.
 *
 * Implementazione prevista (Supabase Storage):
 * - bucket privato, nessun accesso pubblico;
 * - percorso `{organizationId}/{controlId}/{evidenceId}/{nomeFile}`;
 * - policy RLS legate all'organizzazione dell'utente autenticato;
 * - download solo tramite URL firmati a scadenza breve;
 * - verifica di tipo MIME e dimensione massima lato server;
 * - hash SHA-256 per l'integrità del documento.
 *
 * Quando sarà implementato, `EvidenceLocationReference` in `models/types.ts`
 * verrà esteso con una variante `{ kind: "archivio_sicuro"; file: StoredEvidenceFile }`.
 */

export interface StoredEvidenceFile {
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  uploadedAt: string;
}

export interface EvidenceFileStorage {
  upload(params: {
    organizationId: string;
    controlId: string;
    evidenceId: string;
    file: File;
  }): Promise<StoredEvidenceFile>;
  getSignedUrl(storagePath: string, expiresInSeconds: number): Promise<string>;
  remove(storagePath: string): Promise<void>;
}

/** Nell'MVP non esiste alcun archivio file configurato. */
export const evidenceFileStorage: EvidenceFileStorage | null = null;

export const EVIDENCE_UPLOAD_LIMITS = {
  maxSizeBytes: 20 * 1024 * 1024,
  allowedMimeTypes: [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
} as const;
