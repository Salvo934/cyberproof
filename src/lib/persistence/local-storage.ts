import { createDemoData } from "@/lib/data/demo-data";
import type { AppData } from "@/lib/models/types";

/**
 * Persistenza locale (MVP).
 *
 * Nel browser vengono salvati SOLO metadati: controlli, evidenze come
 * descrizione e riferimento testuale. Nessun documento o file viene mai
 * memorizzato in LocalStorage. In una fase successiva questo modulo verrà
 * sostituito da un adapter Supabase con la stessa interfaccia.
 */

export const STORAGE_KEY = "cyberproof:data:v1";

function isAppData(value: unknown): value is AppData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<AppData>;
  return (
    v.schemaVersion === 1 &&
    typeof v.organization === "object" &&
    v.organization !== null &&
    Array.isArray(v.controls) &&
    Array.isArray(v.evidences)
  );
}

/** Legge i dati salvati; se assenti o non validi, inizializza con i dati demo. */
export function loadAppData(): AppData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isAppData(parsed)) return parsed;
      console.warn("[CyberProof] Dati locali non validi: ripristino dei dati demo.");
    }
  } catch (error) {
    console.warn("[CyberProof] Impossibile leggere i dati locali.", error);
  }
  const demo = createDemoData();
  saveAppData(demo);
  return demo;
}

export function saveAppData(data: AppData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("[CyberProof] Impossibile salvare i dati locali.", error);
  }
}

/** Cancella i dati locali e ripristina il dataset dimostrativo. */
export function resetAppData(): AppData {
  const demo = createDemoData();
  saveAppData(demo);
  return demo;
}
