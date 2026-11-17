"use client";

import { useSyncExternalStore } from "react";
import type { ControlInput } from "@/lib/domain/controls";
import type { EvidenceInput } from "@/lib/domain/evidences";
import type { AppData, ControlStatus, Evidence, Organization, SecurityControl, StoredEvidenceFile } from "@/lib/models/types";
import { removeEvidenceFiles, uploadEvidenceFile } from "@/lib/persistence/evidence-file-storage";
import * as repo from "@/lib/persistence/supabase-repository";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Store client: cache in memoria dei dati dell'organizzazione, caricati da
 * Supabase. Le azioni scrivono prima sul database e aggiornano la cache solo
 * a operazione riuscita, così l'interfaccia non mostra mai dati non salvati.
 */

export type LoadStatus = "idle" | "loading" | "ready" | "error";

interface StoreState {
  status: LoadStatus;
  data: AppData | null;
  error: string | null;
}

type Listener = () => void;

const INITIAL: StoreState = { status: "idle", data: null, error: null };
let state: StoreState = INITIAL;
const listeners = new Set<Listener>();
let authListenerAttached = false;

function setState(next: StoreState) {
  state = next;
  for (const listener of listeners) listener();
}

function setData(updater: (data: AppData) => AppData) {
  if (!state.data) return;
  setState({ ...state, data: updater(state.data) });
}

function requireData(): AppData {
  if (!state.data) throw new repo.RepositoryError("Dati non ancora caricati.");
  return state.data;
}

const supabase = () => getSupabaseBrowserClient();

async function load() {
  setState({ ...state, status: "loading", error: null });
  try {
    const data = await repo.fetchAppData(supabase());
    setState({ status: "ready", data, error: null });
  } catch (error) {
    console.error("[CyberProof] Caricamento dati non riuscito", error);
    setState({
      status: "error",
      data: null,
      error: error instanceof Error ? error.message : "Impossibile caricare i dati.",
    });
  }
}

function attachAuthListener() {
  if (authListenerAttached) return;
  authListenerAttached = true;
  supabase().auth.onAuthStateChange((event) => {
    // All'uscita la cache viene svuotata: nessun dato resta in memoria.
    if (event === "SIGNED_OUT") setState(INITIAL);
  });
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  attachAuthListener();
  if (state.status === "idle") void load();
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;
const getServerSnapshot = () => INITIAL;

/** Stato completo del caricamento (per mostrare errori e riprovare). */
export function useAppStore(): StoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Dati dell'organizzazione, oppure `null` finché non sono stati caricati. */
export function useAppData(): AppData | null {
  return useAppStore().data;
}

// ---------------------------------------------------------------------------
// Azioni
// ---------------------------------------------------------------------------

const replaceById = <T extends { id: string }>(items: T[], item: T) =>
  items.map((i) => (i.id === item.id ? item : i));

export const appActions = {
  reload: load,

  async updateOrganization(patch: Pick<Organization, "name" | "sector" | "nis2Classification">) {
    const organization = await repo.updateOrganization(supabase(), requireData().organization.id, patch);
    setData((d) => ({ ...d, organization }));
  },

  async createControl(input: ControlInput): Promise<SecurityControl> {
    const control = await repo.insertControl(supabase(), requireData().organization.id, input);
    setData((d) => ({ ...d, controls: [...d.controls, control] }));
    return control;
  },

  async updateControl(id: string, input: ControlInput) {
    const control = await repo.updateControl(supabase(), id, input);
    setData((d) => ({ ...d, controls: replaceById(d.controls, control) }));
  },

  async updateControlStatus(id: string, status: ControlStatus) {
    const control = await repo.updateControlStatus(supabase(), id, status);
    setData((d) => ({ ...d, controls: replaceById(d.controls, control) }));
  },

  async deleteControl(id: string) {
    const filePaths = requireData()
      .evidences.filter((e) => e.controlId === id && e.file)
      .map((e) => e.file!.path);
    await repo.deleteControl(supabase(), id);
    await removeEvidenceFiles(supabase(), filePaths);
    setData((d) => ({
      ...d,
      controls: d.controls.filter((c) => c.id !== id),
      evidences: d.evidences.filter((e) => e.controlId !== id),
    }));
  },

  /** Carica l'eventuale file prima di salvare l'evidenza; se il salvataggio fallisce, il file viene rimosso. */
  async createEvidence(controlId: string, input: EvidenceInput, file: File | null): Promise<Evidence> {
    const organizationId = requireData().organization.id;
    const id = crypto.randomUUID();
    const stored = file
      ? await uploadEvidenceFile(supabase(), { organizationId, controlId, evidenceId: id, file })
      : null;
    try {
      const evidence = await repo.insertEvidence(supabase(), { id, organizationId, controlId, input, file: stored });
      setData((d) => ({ ...d, evidences: [...d.evidences, evidence] }));
      return evidence;
    } catch (error) {
      if (stored) await removeEvidenceFiles(supabase(), [stored.path]);
      throw error;
    }
  },

  /**
   * Aggiorna l'evidenza. `fileChange`:
   * - `{ kind: "keep" }` lascia il file attuale;
   * - `{ kind: "replace", file }` carica il nuovo e rimuove il vecchio;
   * - `{ kind: "remove" }` scollega e cancella il file.
   */
  async updateEvidence(
    evidence: Evidence,
    input: EvidenceInput,
    fileChange: { kind: "keep" } | { kind: "replace"; file: File } | { kind: "remove" },
  ) {
    const organizationId = requireData().organization.id;
    let nextFile: StoredEvidenceFile | null = evidence.file;
    let uploaded: StoredEvidenceFile | null = null;

    if (fileChange.kind === "replace") {
      uploaded = await uploadEvidenceFile(supabase(), {
        organizationId,
        controlId: evidence.controlId,
        evidenceId: evidence.id,
        file: fileChange.file,
      });
      nextFile = uploaded;
    } else if (fileChange.kind === "remove") {
      nextFile = null;
    }

    try {
      const updated = await repo.updateEvidence(supabase(), evidence.id, input, nextFile);
      if (evidence.file && evidence.file.path !== nextFile?.path) {
        await removeEvidenceFiles(supabase(), [evidence.file.path]);
      }
      setData((d) => ({ ...d, evidences: replaceById(d.evidences, updated) }));
    } catch (error) {
      if (uploaded) await removeEvidenceFiles(supabase(), [uploaded.path]);
      throw error;
    }
  },

  async deleteEvidence(evidence: Evidence) {
    await repo.deleteEvidence(supabase(), evidence.id);
    if (evidence.file) await removeEvidenceFiles(supabase(), [evidence.file.path]);
    setData((d) => ({ ...d, evidences: d.evidences.filter((e) => e.id !== evidence.id) }));
  },

  async loadDemoData() {
    const data = requireData();
    if (data.controls.length > 0) {
      throw new repo.RepositoryError("I dati dimostrativi si possono caricare solo con il registro vuoto.");
    }
    await repo.insertDemoData(supabase(), data.organization.id);
    await load();
  },

  async signOut() {
    await supabase().auth.signOut();
    setState(INITIAL);
  },
};

/** Messaggio da mostrare all'utente per un errore di un'azione. */
export function actionErrorMessage(error: unknown, fallback = "Operazione non riuscita. Riprova."): string {
  if (error instanceof repo.RepositoryError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
