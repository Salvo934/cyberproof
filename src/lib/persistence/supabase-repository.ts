import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { createDemoDataset } from "@/lib/data/demo-data";
import type { ControlInput } from "@/lib/domain/controls";
import type { EvidenceInput } from "@/lib/domain/evidences";
import type {
  AppData,
  ControlStatus,
  Evidence,
  Organization,
  RegulatoryReference,
  SecurityControl,
  StoredEvidenceFile,
} from "@/lib/models/types";

/**
 * Accesso ai dati su Supabase (Postgres). Tutte le query passano dalle policy
 * RLS: il client vede e modifica solo i dati della propria organizzazione.
 * Questo modulo converte tra righe del database (snake_case) e modello (camelCase).
 */

// ---------------------------------------------------------------------------
// Righe del database
// ---------------------------------------------------------------------------

interface OrganizationRow {
  id: string;
  name: string;
  sector: string;
  nis2_classification: Organization["nis2Classification"];
}

interface ControlRow {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  category: SecurityControl["category"];
  description: string;
  status: ControlStatus;
  implementation: SecurityControl["implementation"];
  owner: string;
  last_verified_at: string | null;
  regulatory_references: RegulatoryReference[];
  created_at: string;
  updated_at: string;
}

interface EvidenceRow {
  id: string;
  organization_id: string;
  control_id: string;
  title: string;
  description: string;
  document_type: Evidence["documentType"];
  collected_at: string;
  owner: string;
  notes: string;
  reference_location: string | null;
  file_path: string | null;
  file_name: string | null;
  file_mime_type: string | null;
  file_size_bytes: number | null;
  file_sha256: string | null;
  file_uploaded_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Errori
// ---------------------------------------------------------------------------

export class RepositoryError extends Error {
  constructor(
    message: string,
    readonly field?: "code",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "RepositoryError";
  }
}

function fail(error: PostgrestError, fallback: string): never {
  if (error.code === "23505" && error.message.includes("security_controls_organization_id_code_key")) {
    throw new RepositoryError("Esiste già un controllo con questo ID.", "code", { cause: error });
  }
  if (error.code === "42501" || error.code === "PGRST301") {
    throw new RepositoryError("Sessione scaduta o permessi insufficienti. Accedi di nuovo.", undefined, { cause: error });
  }
  throw new RepositoryError(fallback, undefined, { cause: error });
}

// ---------------------------------------------------------------------------
// Conversioni
// ---------------------------------------------------------------------------

const toOrganization = (r: OrganizationRow): Organization => ({
  id: r.id,
  name: r.name,
  sector: r.sector,
  nis2Classification: r.nis2_classification,
});

const toControl = (r: ControlRow): SecurityControl => ({
  id: r.id,
  code: r.code,
  name: r.name,
  category: r.category,
  description: r.description,
  regulatoryReferences: Array.isArray(r.regulatory_references) ? r.regulatory_references : [],
  status: r.status,
  implementation: r.implementation,
  owner: r.owner,
  lastVerifiedAt: r.last_verified_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toEvidence = (r: EvidenceRow): Evidence => ({
  id: r.id,
  controlId: r.control_id,
  title: r.title,
  description: r.description,
  documentType: r.document_type,
  collectedAt: r.collected_at,
  owner: r.owner,
  notes: r.notes,
  reference: r.reference_location ? { kind: "riferimento_esterno", location: r.reference_location } : null,
  file:
    r.file_path && r.file_name && r.file_mime_type && r.file_size_bytes && r.file_sha256 && r.file_uploaded_at
      ? {
          path: r.file_path,
          name: r.file_name,
          mimeType: r.file_mime_type,
          sizeBytes: r.file_size_bytes,
          sha256: r.file_sha256,
          uploadedAt: r.file_uploaded_at,
        }
      : null,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const controlColumns = (input: ControlInput) => ({
  code: input.code,
  name: input.name,
  category: input.category,
  description: input.description,
  status: input.status,
  implementation: input.implementation,
  owner: input.owner,
  last_verified_at: input.lastVerifiedAt,
  regulatory_references: input.regulatoryReferences,
});

const evidenceColumns = (input: EvidenceInput) => ({
  title: input.title,
  description: input.description,
  document_type: input.documentType,
  collected_at: input.collectedAt,
  owner: input.owner,
  notes: input.notes,
  reference_location: input.referenceLocation || null,
});

const fileColumns = (file: StoredEvidenceFile | null) => ({
  file_path: file?.path ?? null,
  file_name: file?.name ?? null,
  file_mime_type: file?.mimeType ?? null,
  file_size_bytes: file?.sizeBytes ?? null,
  file_sha256: file?.sha256 ?? null,
  file_uploaded_at: file?.uploadedAt ?? null,
});

// ---------------------------------------------------------------------------
// Lettura
// ---------------------------------------------------------------------------

export async function fetchAppData(supabase: SupabaseClient): Promise<AppData> {
  const [org, controls, evidences] = await Promise.all([
    supabase.from("organizations").select("id, name, sector, nis2_classification").maybeSingle<OrganizationRow>(),
    supabase.from("security_controls").select("*").order("code").returns<ControlRow[]>(),
    supabase.from("evidences").select("*").order("collected_at", { ascending: false }).returns<EvidenceRow[]>(),
  ]);
  if (org.error) fail(org.error, "Impossibile caricare l'organizzazione.");
  if (!org.data) throw new RepositoryError("Nessuna organizzazione associata a questo account.");
  if (controls.error) fail(controls.error, "Impossibile caricare i controlli.");
  if (evidences.error) fail(evidences.error, "Impossibile caricare le evidenze.");

  return {
    organization: toOrganization(org.data),
    controls: (controls.data ?? []).map(toControl),
    evidences: (evidences.data ?? []).map(toEvidence),
  };
}

// ---------------------------------------------------------------------------
// Organizzazione
// ---------------------------------------------------------------------------

export async function updateOrganization(
  supabase: SupabaseClient,
  id: string,
  patch: Pick<Organization, "name" | "sector" | "nis2Classification">,
): Promise<Organization> {
  const { data, error } = await supabase
    .from("organizations")
    .update({ name: patch.name, sector: patch.sector, nis2_classification: patch.nis2Classification })
    .eq("id", id)
    .select("id, name, sector, nis2_classification")
    .single<OrganizationRow>();
  if (error) fail(error, "Impossibile aggiornare l'organizzazione.");
  return toOrganization(data);
}

// ---------------------------------------------------------------------------
// Controlli
// ---------------------------------------------------------------------------

export async function insertControl(
  supabase: SupabaseClient,
  organizationId: string,
  input: ControlInput,
): Promise<SecurityControl> {
  const { data, error } = await supabase
    .from("security_controls")
    .insert({ organization_id: organizationId, ...controlColumns(input) })
    .select("*")
    .single<ControlRow>();
  if (error) fail(error, "Impossibile salvare il controllo.");
  return toControl(data);
}

export async function updateControl(supabase: SupabaseClient, id: string, input: ControlInput): Promise<SecurityControl> {
  const { data, error } = await supabase
    .from("security_controls")
    .update(controlColumns(input))
    .eq("id", id)
    .select("*")
    .single<ControlRow>();
  if (error) fail(error, "Impossibile aggiornare il controllo.");
  return toControl(data);
}

export async function updateControlStatus(
  supabase: SupabaseClient,
  id: string,
  status: ControlStatus,
): Promise<SecurityControl> {
  const { data, error } = await supabase
    .from("security_controls")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single<ControlRow>();
  if (error) fail(error, "Impossibile aggiornare lo stato.");
  return toControl(data);
}

/** Elimina il controllo; le evidenze collegate vengono eliminate dal database a cascata. */
export async function deleteControl(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("security_controls").delete().eq("id", id);
  if (error) fail(error, "Impossibile eliminare il controllo.");
}

// ---------------------------------------------------------------------------
// Evidenze
// ---------------------------------------------------------------------------

export async function insertEvidence(
  supabase: SupabaseClient,
  params: { id: string; organizationId: string; controlId: string; input: EvidenceInput; file: StoredEvidenceFile | null },
): Promise<Evidence> {
  const { data, error } = await supabase
    .from("evidences")
    .insert({
      id: params.id,
      organization_id: params.organizationId,
      control_id: params.controlId,
      ...evidenceColumns(params.input),
      ...fileColumns(params.file),
    })
    .select("*")
    .single<EvidenceRow>();
  if (error) fail(error, "Impossibile salvare l'evidenza.");
  return toEvidence(data);
}

export async function updateEvidence(
  supabase: SupabaseClient,
  id: string,
  input: EvidenceInput,
  file: StoredEvidenceFile | null,
): Promise<Evidence> {
  const { data, error } = await supabase
    .from("evidences")
    .update({ ...evidenceColumns(input), ...fileColumns(file) })
    .eq("id", id)
    .select("*")
    .single<EvidenceRow>();
  if (error) fail(error, "Impossibile aggiornare l'evidenza.");
  return toEvidence(data);
}

export async function deleteEvidence(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("evidences").delete().eq("id", id);
  if (error) fail(error, "Impossibile eliminare l'evidenza.");
}

// ---------------------------------------------------------------------------
// Dati dimostrativi
// ---------------------------------------------------------------------------

/** Inserisce i 10 controlli e le evidenze di esempio (solo riferimenti, nessun file). */
export async function insertDemoData(supabase: SupabaseClient, organizationId: string): Promise<void> {
  const demo = createDemoDataset();
  const controls = await supabase.from("security_controls").insert(
    demo.controls.map((c) => ({
      id: c.id,
      organization_id: organizationId,
      code: c.code,
      name: c.name,
      category: c.category,
      description: c.description,
      status: c.status,
      implementation: c.implementation,
      owner: c.owner,
      last_verified_at: c.lastVerifiedAt,
      regulatory_references: c.regulatoryReferences,
    })),
  );
  if (controls.error) fail(controls.error, "Impossibile caricare i controlli dimostrativi.");

  const evidences = await supabase.from("evidences").insert(
    demo.evidences.map((e) => ({
      id: e.id,
      organization_id: organizationId,
      control_id: e.controlId,
      title: e.title,
      description: e.description,
      document_type: e.documentType,
      collected_at: e.collectedAt,
      owner: e.owner,
      notes: e.notes,
      reference_location: e.reference?.location ?? null,
    })),
  );
  if (evidences.error) {
    // Evita un registro a metà: rimuove i controlli appena inseriti.
    await supabase.from("security_controls").delete().in("id", demo.controls.map((c) => c.id));
    fail(evidences.error, "Impossibile caricare le evidenze dimostrative.");
  }
}
