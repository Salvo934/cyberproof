import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoredEvidenceFile } from "@/lib/models/types";

/**
 * Archivio sicuro dei documenti di evidenza (Supabase Storage).
 *
 * - bucket privato `evidence-files`, nessun accesso pubblico;
 * - percorso `{organizationId}/{controlId}/{evidenceId}/{nomeFile}`, con policy
 *   RLS che limitano lettura/scrittura alla cartella della propria organizzazione;
 * - download solo tramite URL firmati a scadenza breve;
 * - tipo e dimensione verificati sia qui sia dal bucket (lato server);
 * - impronta SHA-256 calcolata al caricamento per verificare l'integrità.
 */

export const EVIDENCE_BUCKET = "evidence-files";

export const EVIDENCE_UPLOAD_LIMITS = {
  maxSizeBytes: 20 * 1024 * 1024,
  allowedMimeTypes: {
    "application/pdf": "PDF",
    "image/png": "PNG",
    "image/jpeg": "JPEG",
    "text/plain": "TXT",
    "text/csv": "CSV",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word (.docx)",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel (.xlsx)",
  } as Record<string, string>,
} as const;

export const ACCEPT_ATTRIBUTE = Object.keys(EVIDENCE_UPLOAD_LIMITS.allowedMimeTypes).join(",");
export const SIGNED_URL_TTL_SECONDS = 60;

/** Restituisce un messaggio di errore se il file non è accettabile. */
export function validateEvidenceFile(file: File): string | undefined {
  if (file.size === 0) return "Il file è vuoto.";
  if (file.size > EVIDENCE_UPLOAD_LIMITS.maxSizeBytes) return "Il file supera il limite di 20 MB.";
  if (!EVIDENCE_UPLOAD_LIMITS.allowedMimeTypes[file.type]) {
    return `Formato non supportato. Formati ammessi: ${Object.values(EVIDENCE_UPLOAD_LIMITS.allowedMimeTypes).join(", ")}.`;
  }
  return undefined;
}

/** Nome file sicuro per lo storage: niente percorsi, spazi o caratteri speciali. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "documento";
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) : "";
  const cleanStem =
    stem
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "")
      .slice(0, 80) || "documento";
  return ext ? `${cleanStem}.${ext}` : cleanStem;
}

async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function uploadEvidenceFile(
  supabase: SupabaseClient,
  params: { organizationId: string; controlId: string; evidenceId: string; file: File },
): Promise<StoredEvidenceFile> {
  const { organizationId, controlId, evidenceId, file } = params;
  const invalid = validateEvidenceFile(file);
  if (invalid) throw new Error(invalid);

  const sha256 = await sha256Hex(file);
  // Prefisso univoco: un file sostituito non collide mai con il precedente.
  const path = `${organizationId}/${controlId}/${evidenceId}/${Date.now().toString(36)}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from(EVIDENCE_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
    cacheControl: "private, max-age=0",
  });
  if (error) throw new Error("Caricamento del file non riuscito.", { cause: error });

  return {
    path,
    name: file.name.slice(0, 200),
    mimeType: file.type,
    sizeBytes: file.size,
    sha256,
    uploadedAt: new Date().toISOString(),
  };
}

export async function getEvidenceFileUrl(supabase: SupabaseClient, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) throw new Error("Impossibile aprire il documento.", { cause: error });
  return data.signedUrl;
}

/** Rimuove i file indicati. Gli errori vengono solo registrati: un file orfano non blocca l'utente. */
export async function removeEvidenceFiles(supabase: SupabaseClient, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(EVIDENCE_BUCKET).remove(paths);
  if (error) console.warn("[CyberProof] Rimozione file non riuscita", error);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
