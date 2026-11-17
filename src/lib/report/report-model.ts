import { computeAttentionItems, computeDashboardMetrics, type AttentionItem, type DashboardMetrics } from "@/lib/domain/dashboard";
import { sortEvidencesByDate } from "@/lib/domain/evidences";
import { REGULATORY_SOURCE_LABEL } from "@/lib/models/labels";
import type { AppData, Evidence, Organization, RegulatorySource, SecurityControl } from "@/lib/models/types";

/**
 * Modello indipendente dal formato di output: raccoglie e ordina i dati del
 * report. Il rendering (PDF oggi, eventualmente altri formati domani) non
 * contiene logica applicativa.
 */

export const REPORT_DISCLAIMER =
  "Questo report è uno strumento di supporto documentale generato da CyberProof. Descrive lo stato " +
  "della documentazione dei controlli di sicurezza registrati e non costituisce una certificazione, " +
  "una valutazione o un'attestazione di conformità alla Direttiva (UE) 2022/2555 (NIS2), al " +
  "D.Lgs. 138/2024 o ad altre normative. Gli stati di implementazione sono dichiarati dai " +
  "responsabili indicati e i riferimenti normativi sono associazioni indicative da verificare sulle fonti ufficiali.";

export interface ReportControlEntry {
  control: SecurityControl;
  evidences: Evidence[];
}

export interface ReportReferenceGroup {
  source: RegulatorySource;
  sourceLabel: string;
  articles: { article: string; summary?: string; controlCodes: string[] }[];
}

export interface ReportModel {
  organization: Organization;
  generatedAt: Date;
  metrics: DashboardMetrics;
  controls: ReportControlEntry[];
  openActivities: AttentionItem[];
  references: ReportReferenceGroup[];
}

function byCode(a: SecurityControl, b: SecurityControl) {
  return a.code.localeCompare(b.code, "it", { numeric: true });
}

function groupReferences(controls: SecurityControl[]): ReportReferenceGroup[] {
  const groups = new Map<RegulatorySource, Map<string, { summary?: string; controlCodes: string[] }>>();
  for (const control of controls) {
    for (const ref of control.regulatoryReferences) {
      const articles = groups.get(ref.source) ?? new Map();
      const entry = articles.get(ref.article) ?? { summary: ref.summary, controlCodes: [] };
      if (!entry.controlCodes.includes(control.code)) entry.controlCodes.push(control.code);
      articles.set(ref.article, entry);
      groups.set(ref.source, articles);
    }
  }
  return (Object.keys(REGULATORY_SOURCE_LABEL) as RegulatorySource[])
    .filter((source) => groups.has(source))
    .map((source) => ({
      source,
      sourceLabel: REGULATORY_SOURCE_LABEL[source],
      articles: [...groups.get(source)!.entries()]
        .map(([article, v]) => ({ article, ...v }))
        .sort((a, b) => a.article.localeCompare(b.article, "it", { numeric: true })),
    }));
}

export function buildReportModel(data: AppData, generatedAt: Date = new Date()): ReportModel {
  const controls = [...data.controls].sort(byCode);
  const today = generatedAt.toISOString().slice(0, 10);
  return {
    organization: data.organization,
    generatedAt,
    metrics: computeDashboardMetrics(data),
    controls: controls.map((control) => ({
      control,
      evidences: sortEvidencesByDate(data.evidences.filter((e) => e.controlId === control.id)),
    })),
    openActivities: computeAttentionItems(data, today),
    references: groupReferences(controls),
  };
}

export function reportFileName(generatedAt: Date): string {
  return `cyberproof-report-${generatedAt.toISOString().slice(0, 10)}.pdf`;
}
