"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LoadingBlock } from "@/components/common/loading-block";
import { StatusBadge } from "@/components/common/tone-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTROL_STATUSES, NIS2_CLASSIFICATION_LABEL } from "@/lib/models/labels";
import { buildReportModel, reportFileName } from "@/lib/report/report-model";
import { useAppData } from "@/lib/store/app-store";

const SECTIONS = [
  "Dati dell'organizzazione e data di generazione",
  "Nota sulla natura documentale del report",
  "Riepilogo dei controlli per stato",
  "Stato, implementazione dichiarata e ultima verifica di ciascun controllo",
  "Evidenze registrate con riferimento al documento",
  "Attività ancora aperte",
  "Riferimenti normativi associati",
];

export function ReportExport() {
  const data = useAppData();
  const [generating, setGenerating] = useState(false);

  // Anteprima: stesso modello usato per il PDF, quindi i numeri coincidono.
  const preview = useMemo(() => (data ? buildReportModel(data) : null), [data]);

  if (!data || !preview) return <LoadingBlock rows={4} />;

  const referenceCount = preview.references.reduce((n, g) => n + g.articles.length, 0);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      // La libreria PDF viene caricata solo quando serve.
      const { renderReportPdf } = await import("@/lib/report/render-pdf");
      const model = buildReportModel(data, new Date());
      renderReportPdf(model).save(reportFileName(model.generatedAt));
      toast.success("Report PDF generato");
    } catch (error) {
      console.error("[CyberProof] Generazione PDF non riuscita", error);
      toast.error("Non è stato possibile generare il report.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Report di supporto documentale</CardTitle>
          <CardDescription>
            {preview.organization.name}
            {preview.organization.isDemo && " (dati dimostrativi)"} ·{" "}
            {NIS2_CLASSIFICATION_LABEL[preview.organization.nis2Classification]} (dichiarata)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Controlli", preview.metrics.totalControls],
              ["Evidenze", preview.metrics.totalEvidences],
              ["Attività aperte", preview.openActivities.length],
              ["Riferimenti normativi", referenceCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border px-3 py-2">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-lg font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-2">
            {CONTROL_STATUSES.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <StatusBadge status={s} />
                <span className="tabular-nums">{preview.metrics.byStatus[s]}</span>
              </span>
            ))}
          </div>

          {preview.metrics.totalControls === 0 ? (
            <p className="text-sm text-muted-foreground">
              Il registro è vuoto: <Link href="/controls" className="underline underline-offset-4">aggiungi un controllo</Link>{" "}
              per generare un report.
            </p>
          ) : (
            <Button onClick={handleDownload} disabled={generating}>
              {generating ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
              {generating ? "Generazione in corso…" : "Scarica report PDF"}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Il PDF viene generato nel browser con i dati attuali del registro e salvato come{" "}
            <span className="font-mono">{reportFileName(new Date())}</span>. Nessun dato viene inviato a server esterni.
          </p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Contenuto del report</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {SECTIONS.map((section, i) => (
              <li key={section} className="flex gap-2 text-sm">
                <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  <span className="sr-only">{i + 1}. </span>
                  {section}
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
