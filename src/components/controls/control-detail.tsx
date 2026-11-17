"use client";

import { ArrowLeft, FileSearch, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { EvidenceSection } from "@/components/evidences/evidence-section";
import { LoadingBlock } from "@/components/common/loading-block";
import { ImplementationBadge, StatusBadge } from "@/components/common/tone-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateControlStatus } from "@/lib/domain/controls";
import { getControlById, getEvidencesForControl } from "@/lib/domain/selectors";
import { formatDate } from "@/lib/format";
import {
  CONTROL_CATEGORY_LABEL,
  CONTROL_STATUSES,
  CONTROL_STATUS_META,
  REGULATORY_SOURCE_LABEL,
} from "@/lib/models/labels";
import type { ControlStatus } from "@/lib/models/types";
import { updateAppData, useAppData } from "@/lib/store/app-store";
import { ControlFormDialog } from "./control-form-dialog";
import { DeleteControlDialog } from "./delete-control-dialog";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export function ControlDetail({ controlId }: { controlId: string }) {
  const data = useAppData();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  if (!data || leaving) return <LoadingBlock rows={5} />;

  const control = getControlById(data, controlId);

  if (!control) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Controllo non trovato"
        description="Il controllo richiesto non esiste nel registro salvato in questo browser."
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/controls">Torna al registro</Link>
        </Button>
      </EmptyState>
    );
  }

  const evidences = getEvidencesForControl(data, control.id);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3 text-muted-foreground">
        <Link href="/controls">
          <ArrowLeft aria-hidden /> Registro controlli
        </Link>
      </Button>
      <PageHeader
        title={control.name}
        description={control.description}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil aria-hidden /> Modifica
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 aria-hidden /> Elimina
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dettagli</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="ID controllo">
                <span className="font-mono text-xs">{control.code}</span>
              </Field>
              <Field label="Categoria">{CONTROL_CATEGORY_LABEL[control.category]}</Field>
              <Field label="Stato della documentazione">
                <Select
                  value={control.status}
                  onValueChange={(value) => {
                    const status = value as ControlStatus;
                    updateAppData((d) => updateControlStatus(d, control.id, status));
                    toast.success(`Stato aggiornato: ${CONTROL_STATUS_META[status].label}`);
                  }}
                >
                  <SelectTrigger size="sm" aria-label="Stato della documentazione" className="min-w-40">
                    <SelectValue>
                      <StatusBadge status={control.status} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CONTROL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {CONTROL_STATUS_META[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Implementazione della misura">
                <ImplementationBadge value={control.implementation} />
              </Field>
              <Field label="Responsabile">{control.owner}</Field>
              <Field label="Ultima verifica di efficacia">{formatDate(control.lastVerifiedAt)}</Field>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riferimenti normativi</CardTitle>
          </CardHeader>
          <CardContent>
            {control.regulatoryReferences.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun riferimento associato.</p>
            ) : (
              <ul className="space-y-3">
                {control.regulatoryReferences.map((ref, i) => (
                  <li key={`${ref.source}-${i}`} className="text-sm">
                    <p className="font-medium">{REGULATORY_SOURCE_LABEL[ref.source]}</p>
                    <p className="text-muted-foreground">{ref.article}</p>
                    {ref.summary && <p className="mt-0.5 text-xs text-muted-foreground">{ref.summary}</p>}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-[11px] leading-4 text-muted-foreground">
              Associazione indicativa: verificare sempre il testo sulle fonti ufficiali.
            </p>
          </CardContent>
        </Card>
      </div>

      <EvidenceSection control={control} evidences={evidences} />

      <ControlFormDialog open={editOpen} onOpenChange={setEditOpen} data={data} control={control} />
      <DeleteControlDialog
        control={deleteOpen ? control : null}
        evidenceCount={evidences.length}
        onOpenChange={setDeleteOpen}
        onDeleted={() => {
          setLeaving(true);
          router.replace("/controls");
        }}
      />
    </>
  );
}
