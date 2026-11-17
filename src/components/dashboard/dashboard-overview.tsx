"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LoadingBlock } from "@/components/common/loading-block";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  REVIEW_INTERVAL_MONTHS,
  computeAttentionItems,
  computeDashboardMetrics,
  statusDistribution,
} from "@/lib/domain/dashboard";
import { useAppData } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";
import { AttentionList } from "./attention-list";
import { StatusDistributionChart } from "./status-distribution-chart";

interface StatTileProps {
  label: string;
  value: number;
  hint: string;
  dotClassName?: string;
}

function StatTile({ label, value, hint, dotClassName }: StatTileProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {dotClassName && <span className={cn("size-1.5 rounded-full", dotClassName)} aria-hidden />}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export function DashboardOverview() {
  const data = useAppData();
  const view = useMemo(() => {
    // Calcolato solo nel browser: i dati esistono solo lato client (LocalStorage).
    if (!data) return null;
    const today = new Date().toISOString().slice(0, 10);
    const metrics = computeDashboardMetrics(data);
    return {
      metrics,
      distribution: statusDistribution(metrics),
      attention: computeAttentionItems(data, today),
    };
  }, [data]);

  if (!view) return <LoadingBlock rows={4} />;
  const { metrics, distribution, attention } = view;

  if (metrics.totalControls === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Il registro è vuoto.{" "}
          <Link href="/controls" className="font-medium text-foreground underline underline-offset-4">
            Aggiungi il primo controllo
          </Link>
          .
        </CardContent>
      </Card>
    );
  }

  const critical = attention.filter((a) => a.severity === "critical").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Controlli registrati"
          value={metrics.totalControls}
          hint={`${metrics.totalEvidences} evidenze registrate`}
        />
        <StatTile
          label="Documentati"
          value={metrics.documented}
          hint="Documentazione predisposta"
          dotClassName="bg-success"
        />
        <StatTile
          label="Senza evidenza"
          value={metrics.withoutEvidence}
          hint="Nessun documento associato"
          dotClassName={metrics.withoutEvidence > 0 ? "bg-destructive" : "bg-success"}
        />
        <StatTile
          label="Da verificare"
          value={metrics.toVerify}
          hint="Documentazione da rivedere"
          dotClassName="bg-warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribuzione per stato</CardTitle>
            <CardDescription>Stato della documentazione dei controlli registrati.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDistributionChart data={distribution} />
          </CardContent>
        </Card>

        <Card className="gap-0 pb-0 lg:col-span-3">
          <CardHeader className="border-b">
            <CardTitle>Attività che richiedono attenzione</CardTitle>
            <CardDescription>
              {attention.length === 0
                ? "Nessuna attività aperta."
                : `${attention.length} ${attention.length === 1 ? "attività aperta" : "attività aperte"}${critical > 0 ? `, di cui ${critical} ${critical === 1 ? "critica" : "critiche"}` : ""}.`}
            </CardDescription>
          </CardHeader>
          <AttentionList items={attention} />
        </Card>
      </div>

      <details className="group rounded-lg border px-4 py-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground outline-none select-none focus-visible:underline">
          Come vengono individuate le attività
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-4 leading-5">
          <li><strong className="font-medium text-destructive">Critico</strong>: controllo segnato come documentato ma senza evidenze registrate.</li>
          <li><strong className="font-medium text-warning">Attenzione</strong>: controllo in lavorazione o da verificare senza evidenze; documentazione da rivedere; ultima verifica di efficacia oltre {REVIEW_INTERVAL_MONTHS} mesi; misura dichiarata attuata ma mai verificata.</li>
          <li><strong className="font-medium text-foreground">Da avviare</strong>: controllo ancora da valutare.</li>
        </ul>
      </details>
    </div>
  );
}
