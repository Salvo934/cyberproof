import { CONTROL_STATUSES } from "@/lib/models/labels";
import type { AppData, ControlStatus, SecurityControl } from "@/lib/models/types";
import { countByStatus, evidenceCountByControl } from "./selectors";

/**
 * Metriche della dashboard. Sono conteggi descrittivi dello stato della
 * documentazione: non rappresentano un punteggio né un livello di conformità.
 */

/** Intervallo oltre il quale una verifica di efficacia è considerata da rinnovare. */
export const REVIEW_INTERVAL_MONTHS = 12;

export interface DashboardMetrics {
  totalControls: number;
  documented: number;
  withoutEvidence: number;
  toVerify: number;
  totalEvidences: number;
  byStatus: Record<ControlStatus, number>;
}

export function computeDashboardMetrics(data: AppData): DashboardMetrics {
  const evidenceCounts = evidenceCountByControl(data);
  const byStatus = countByStatus(data.controls);
  return {
    totalControls: data.controls.length,
    documented: byStatus.documentato,
    withoutEvidence: data.controls.filter((c) => !evidenceCounts.has(c.id)).length,
    toVerify: byStatus.da_verificare,
    totalEvidences: data.evidences.length,
    byStatus,
  };
}

export type AttentionSeverity = "critical" | "warning" | "info";

export type AttentionReason =
  | "documentato_senza_evidenze"
  | "senza_evidenze"
  | "da_verificare"
  | "verifica_scaduta"
  | "attuata_mai_verificata"
  | "da_valutare";

export interface AttentionItem {
  control: SecurityControl;
  reason: AttentionReason;
  severity: AttentionSeverity;
  message: string;
}

const SEVERITY_ORDER: Record<AttentionSeverity, number> = { critical: 0, warning: 1, info: 2 };

/** Sottrae `months` mesi a una data ISO `YYYY-MM-DD` (calcolo in UTC). */
function subtractMonths(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

/**
 * Regole che individuano le attività aperte. Ogni controllo compare al massimo
 * una volta per motivo; l'elenco è ordinato per gravità e poi per codice.
 */
export function computeAttentionItems(data: AppData, today: string): AttentionItem[] {
  const evidenceCounts = evidenceCountByControl(data);
  const reviewThreshold = subtractMonths(today, REVIEW_INTERVAL_MONTHS);
  const items: AttentionItem[] = [];

  for (const control of data.controls) {
    const hasEvidence = evidenceCounts.has(control.id);

    if (!hasEvidence && control.status === "documentato") {
      items.push({
        control,
        reason: "documentato_senza_evidenze",
        severity: "critical",
        message: "Segnato come documentato ma senza evidenze registrate.",
      });
    } else if (!hasEvidence && control.status !== "da_valutare") {
      items.push({
        control,
        reason: "senza_evidenze",
        severity: "warning",
        message: "Nessuna evidenza registrata.",
      });
    }

    if (control.status === "da_verificare") {
      items.push({
        control,
        reason: "da_verificare",
        severity: "warning",
        message: "La documentazione richiede una revisione.",
      });
    }

    if (control.lastVerifiedAt && control.lastVerifiedAt < reviewThreshold) {
      items.push({
        control,
        reason: "verifica_scaduta",
        severity: "warning",
        message: `Ultima verifica di efficacia oltre ${REVIEW_INTERVAL_MONTHS} mesi fa.`,
      });
    } else if (!control.lastVerifiedAt && control.implementation === "attuata") {
      items.push({
        control,
        reason: "attuata_mai_verificata",
        severity: "warning",
        message: "Misura dichiarata attuata, ma efficacia mai verificata.",
      });
    }

    if (control.status === "da_valutare") {
      items.push({
        control,
        reason: "da_valutare",
        severity: "info",
        message: "Controllo ancora da valutare.",
      });
    }
  }

  return items.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      a.control.code.localeCompare(b.control.code, "it", { numeric: true }),
  );
}

export function statusDistribution(metrics: DashboardMetrics) {
  return CONTROL_STATUSES.map((status) => ({ status, count: metrics.byStatus[status] }));
}
