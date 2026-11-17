"use client";

import { useSyncExternalStore } from "react";
import {
  STORAGE_KEY,
  loadAppData,
  resetAppData,
  saveAppData,
} from "@/lib/persistence/local-storage";
import type { AppData } from "@/lib/models/types";

/**
 * Store client minimale basato su useSyncExternalStore.
 * Unica fonte di verità per tutte le pagine: dashboard, registro e report
 * leggono gli stessi dati, così restano sempre coerenti.
 */

type Listener = () => void;

let state: AppData | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function ensureLoaded(): AppData {
  if (state === null) state = loadAppData();
  return state;
}

function onStorage(event: StorageEvent) {
  // Sincronizza le modifiche fatte in un'altra scheda del browser.
  if (event.key !== STORAGE_KEY) return;
  state = loadAppData();
  emit();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): AppData {
  return ensureLoaded();
}

function getServerSnapshot(): null {
  return null;
}

/** Aggiorna lo stato in modo immutabile e lo persiste. */
export function updateAppData(updater: (current: AppData) => AppData): void {
  state = updater(ensureLoaded());
  saveAppData(state);
  emit();
}

export function resetToDemoData(): void {
  state = resetAppData();
  emit();
}

/**
 * Restituisce i dati dell'applicazione, oppure `null` durante il rendering
 * lato server e la prima idratazione (LocalStorage non è disponibile).
 */
export function useAppData(): AppData | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
