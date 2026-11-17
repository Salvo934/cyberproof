import { CONTROL_STATUSES } from "@/lib/models/labels";
import type { AppData, ControlStatus, Evidence, SecurityControl } from "@/lib/models/types";

export function getControlById(data: AppData, id: string): SecurityControl | undefined {
  return data.controls.find((c) => c.id === id);
}

export function getEvidencesForControl(data: AppData, controlId: string): Evidence[] {
  return data.evidences.filter((e) => e.controlId === controlId);
}

export function countByStatus(controls: SecurityControl[]): Record<ControlStatus, number> {
  const counts = Object.fromEntries(CONTROL_STATUSES.map((s) => [s, 0])) as Record<
    ControlStatus,
    number
  >;
  for (const c of controls) counts[c.status] += 1;
  return counts;
}

/** Numero di evidenze registrate per ciascun controllo. */
export function evidenceCountByControl(data: AppData): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of data.evidences) map.set(e.controlId, (map.get(e.controlId) ?? 0) + 1);
  return map;
}
