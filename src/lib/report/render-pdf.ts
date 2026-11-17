import { jsPDF } from "jspdf";
import autoTable, { type CellDef, type RowInput } from "jspdf-autotable";
import type { AttentionSeverity } from "@/lib/domain/dashboard";
import { formatDate } from "@/lib/format";
import {
  CONTROL_CATEGORY_LABEL,
  CONTROL_STATUSES,
  CONTROL_STATUS_META,
  EVIDENCE_DOCUMENT_TYPE_LABEL,
  IMPLEMENTATION_META,
  NIS2_CLASSIFICATION_LABEL,
  type Tone,
} from "@/lib/models/labels";
import { REPORT_DISCLAIMER, type ReportModel } from "./report-model";

/** Rendering del report in PDF (A4, unità in mm). Nessuna logica applicativa qui. */

type RGB = [number, number, number];

const PAGE = { margin: 16, width: 210, height: 297 } as const;
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;

const COLOR = {
  text: [23, 23, 23] as RGB,
  muted: [110, 110, 110] as RGB,
  border: [225, 225, 225] as RGB,
  subtle: [246, 246, 245] as RGB,
};

const TONE_RGB: Record<Tone, RGB> = {
  neutral: [110, 110, 110],
  info: [49, 98, 160],
  success: [31, 128, 72],
  warning: [190, 100, 20],
  danger: [190, 40, 40],
};

const SEVERITY_LABEL: Record<AttentionSeverity, { label: string; tone: Tone }> = {
  critical: { label: "Critico", tone: "danger" },
  warning: { label: "Attenzione", tone: "warning" },
  info: { label: "Da avviare", tone: "neutral" },
};

/**
 * I font standard PDF supportano solo caratteri Latin-1: le lettere accentate
 * italiane sono incluse, mentre trattini tipografici e simboli vanno convertiti.
 */
export function pdfText(value: string): string {
  return value
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/›/g, ">")
    .replace(/…/g, "...")
    .replace(/[^\x00-\xFF]/g, "?");
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

class ReportWriter {
  readonly doc = new jsPDF({ unit: "mm", format: "a4" });
  y: number = PAGE.margin;

  ensureSpace(height: number) {
    if (this.y + height > PAGE.height - PAGE.margin - 8) {
      this.doc.addPage();
      this.y = PAGE.margin;
    }
  }

  text(value: string, opts: { size?: number; bold?: boolean; color?: RGB; gap?: number } = {}) {
    const { size = 9, bold = false, color = COLOR.text, gap = 1.5 } = opts;
    this.doc.setFont("helvetica", bold ? "bold" : "normal");
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
    const lines = this.doc.splitTextToSize(pdfText(value), CONTENT_WIDTH) as string[];
    const lineHeight = size * 0.42;
    this.ensureSpace(lines.length * lineHeight);
    this.doc.text(lines, PAGE.margin, this.y + lineHeight * 0.8);
    this.y += lines.length * lineHeight + gap;
  }

  heading(value: string) {
    this.ensureSpace(16);
    this.y += 4;
    this.text(value, { size: 12, bold: true, gap: 1 });
    this.doc.setDrawColor(...COLOR.border);
    this.doc.setLineWidth(0.3);
    this.doc.line(PAGE.margin, this.y, PAGE.width - PAGE.margin, this.y);
    this.y += 3;
  }

  table(head: (string | CellDef)[], body: RowInput[], columnStyles: Record<number, object> = {}) {
    autoTable(this.doc, {
      startY: this.y,
      head: [head.map((h) => (typeof h === "string" ? pdfText(h) : h))],
      body,
      margin: { left: PAGE.margin, right: PAGE.margin, bottom: PAGE.margin + 8 },
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: { top: 1.6, bottom: 1.6, left: 2, right: 2 },
        textColor: COLOR.text,
        lineColor: COLOR.border,
        lineWidth: { bottom: 0.2 },
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: { fontStyle: "bold", fillColor: COLOR.subtle, textColor: COLOR.muted, fontSize: 7.5 },
      columnStyles,
    });
    const finalY = (this.doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY;
    this.y = (finalY ?? this.y) + 4;
  }

  disclaimerBox() {
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8);
    const lines = this.doc.splitTextToSize(pdfText(REPORT_DISCLAIMER), CONTENT_WIDTH - 8) as string[];
    const height = lines.length * 3.4 + 9;
    this.ensureSpace(height);
    this.doc.setFillColor(...COLOR.subtle);
    this.doc.setDrawColor(...COLOR.border);
    this.doc.roundedRect(PAGE.margin, this.y, CONTENT_WIDTH, height, 1.5, 1.5, "FD");
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...COLOR.text);
    this.doc.text(pdfText("Nota importante"), PAGE.margin + 4, this.y + 5);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...COLOR.muted);
    this.doc.text(lines, PAGE.margin + 4, this.y + 9.2);
    this.y += height + 4;
  }

  footers(organizationName: string) {
    const total = this.doc.getNumberOfPages();
    for (let page = 1; page <= total; page++) {
      this.doc.setPage(page);
      const y = PAGE.height - 9;
      this.doc.setDrawColor(...COLOR.border);
      this.doc.setLineWidth(0.2);
      this.doc.line(PAGE.margin, y - 4, PAGE.width - PAGE.margin, y - 4);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(7);
      this.doc.setTextColor(...COLOR.muted);
      this.doc.text(
        pdfText(`CyberProof - ${organizationName} - Supporto documentale, non costituisce certificazione di conformità`),
        PAGE.margin,
        y,
      );
      this.doc.text(`Pagina ${page} di ${total}`, PAGE.width - PAGE.margin, y, { align: "right" });
    }
  }
}

function toneCell(label: string, tone: Tone): CellDef {
  return { content: pdfText(label), styles: { textColor: TONE_RGB[tone], fontStyle: "bold" } };
}

export function renderReportPdf(model: ReportModel): jsPDF {
  const w = new ReportWriter();
  const { organization, metrics } = model;

  w.doc.setProperties({
    title: pdfText(`Report CyberProof - ${organization.name}`),
    subject: "Report di supporto documentale sui controlli di sicurezza",
    creator: "CyberProof",
  });

  // Intestazione
  w.text("CYBERPROOF", { size: 8, bold: true, color: COLOR.muted, gap: 1 });
  w.text("Report di supporto documentale", { size: 18, bold: true, gap: 3 });
  w.text(organization.isDemo ? `${organization.name} (organizzazione dimostrativa, dati fittizi)` : organization.name, {
    size: 11,
    bold: true,
    gap: 1,
  });
  w.text(`Settore: ${organization.sector}`, { color: COLOR.muted, gap: 0.5 });
  w.text(`Classificazione NIS2 dichiarata: ${NIS2_CLASSIFICATION_LABEL[organization.nis2Classification]}`, {
    color: COLOR.muted,
    gap: 0.5,
  });
  w.text(`Data di generazione: ${formatDateTime(model.generatedAt)}`, { color: COLOR.muted, gap: 5 });
  w.disclaimerBox();

  // 1. Riepilogo
  w.heading("1. Riepilogo dei controlli");
  w.table(
    ["Indicatore", { content: "Valore", styles: { halign: "right" } }],
    [
      ["Controlli registrati", String(metrics.totalControls)],
      ...CONTROL_STATUSES.map((s) => [
        pdfText(`Stato documentazione: ${CONTROL_STATUS_META[s].label}`),
        String(metrics.byStatus[s]),
      ]),
      ["Controlli senza evidenze registrate", String(metrics.withoutEvidence)],
      ["Evidenze registrate", String(metrics.totalEvidences)],
      ["Attività aperte", String(model.openActivities.length)],
    ].map((row) => row.map(pdfText)),
    { 0: { cellWidth: 120 }, 1: { halign: "right" } },
  );
  w.text(
    "I valori sono conteggi descrittivi dello stato della documentazione e non rappresentano un livello o una percentuale di conformità.",
    { size: 7.5, color: COLOR.muted },
  );

  // 2. Stato dei controlli
  w.heading("2. Stato di ciascun controllo");
  w.table(
    ["ID", "Controllo", "Categoria", "Stato documentazione", "Implementazione (dichiarata)", "Responsabile", "Ultima verifica", "Evid."],
    model.controls.map(({ control, evidences }) => [
      pdfText(control.code),
      pdfText(control.name),
      pdfText(CONTROL_CATEGORY_LABEL[control.category]),
      toneCell(CONTROL_STATUS_META[control.status].label, CONTROL_STATUS_META[control.status].tone),
      pdfText(IMPLEMENTATION_META[control.implementation].label.replace(" (dichiarata)", "")),
      pdfText(control.owner),
      pdfText(formatDate(control.lastVerifiedAt)),
      String(evidences.length),
    ]),
    { 0: { cellWidth: 20, font: "courier", fontSize: 7 }, 1: { cellWidth: 38 }, 7: { halign: "right", cellWidth: 10 } },
  );

  // 3. Evidenze
  w.heading("3. Evidenze registrate");
  const withEvidence = model.controls.filter((c) => c.evidences.length > 0);
  if (withEvidence.length === 0) {
    w.text("Nessuna evidenza registrata.", { color: COLOR.muted });
  } else {
    w.table(
      ["Controllo", "Evidenza", "Tipologia", "Data raccolta", "Responsabile", "Riferimento al documento"],
      withEvidence.flatMap(({ control, evidences }) =>
        evidences.map((e) => [
          pdfText(control.code),
          pdfText(e.description ? `${e.title}\n${e.description}` : e.title),
          pdfText(EVIDENCE_DOCUMENT_TYPE_LABEL[e.documentType]),
          pdfText(formatDate(e.collectedAt)),
          pdfText(e.owner),
          pdfText(e.reference?.location ?? "Non indicato"),
        ]),
      ),
      { 0: { cellWidth: 20, font: "courier", fontSize: 7 }, 1: { cellWidth: 48 }, 5: { cellWidth: 42, fontSize: 7 } },
    );
  }
  const withoutEvidence = model.controls.filter((c) => c.evidences.length === 0);
  if (withoutEvidence.length > 0) {
    w.text(`Controlli senza evidenze: ${withoutEvidence.map((c) => c.control.code).join(", ")}.`, {
      size: 8,
      color: COLOR.muted,
    });
  }
  w.text(
    "Le evidenze sono registrate come riferimenti: i documenti originali sono conservati dall'organizzazione e non sono archiviati in CyberProof.",
    { size: 7.5, color: COLOR.muted },
  );

  // 4. Attività aperte
  w.heading("4. Attività ancora aperte");
  if (model.openActivities.length === 0) {
    w.text("Nessuna attività aperta secondo le regole applicate.", { color: COLOR.muted });
  } else {
    w.table(
      ["Priorità", "ID", "Controllo", "Motivo"],
      model.openActivities.map((a) => [
        toneCell(SEVERITY_LABEL[a.severity].label, SEVERITY_LABEL[a.severity].tone),
        pdfText(a.control.code),
        pdfText(a.control.name),
        pdfText(a.message),
      ]),
      { 0: { cellWidth: 22 }, 1: { cellWidth: 22, font: "courier", fontSize: 7 }, 2: { cellWidth: 60 } },
    );
  }

  // 5. Riferimenti normativi
  w.heading("5. Riferimenti normativi associati");
  if (model.references.length === 0) {
    w.text("Nessun riferimento normativo associato ai controlli.", { color: COLOR.muted });
  } else {
    for (const group of model.references) {
      w.text(group.sourceLabel, { size: 9.5, bold: true, gap: 1.5 });
      w.table(
        ["Riferimento", "Sintesi", "Controlli associati"],
        group.articles.map((a) => [pdfText(a.article), pdfText(a.summary ?? "-"), pdfText(a.controlCodes.join(", "))]),
        { 0: { cellWidth: 40 }, 2: { cellWidth: 42, font: "courier", fontSize: 7 } },
      );
    }
  }
  w.text(
    "Le associazioni tra controlli e riferimenti normativi sono indicative e vanno verificate sui testi ufficiali (Direttiva (UE) 2022/2555, D.Lgs. 138/2024, documentazione ACN). Il regolamento DORA non è incluso in questa versione.",
    { size: 7.5, color: COLOR.muted },
  );

  w.footers(organization.name);
  return w.doc;
}
