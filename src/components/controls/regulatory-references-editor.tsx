"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REGULATORY_SOURCE_LABEL } from "@/lib/models/labels";
import type { RegulatoryReference, RegulatorySource } from "@/lib/models/types";

const SOURCES = Object.keys(REGULATORY_SOURCE_LABEL) as RegulatorySource[];

interface Props {
  value: RegulatoryReference[];
  onChange: (value: RegulatoryReference[]) => void;
}

export function RegulatoryReferencesEditor({ value, onChange }: Props) {
  const update = (index: number, patch: Partial<RegulatoryReference>) =>
    onChange(value.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">Nessun riferimento normativo associato.</p>
      )}
      {value.map((ref, index) => (
        <div key={index} className="grid gap-2 rounded-lg border p-2 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto]">
          <Select value={ref.source} onValueChange={(v) => update(index, { source: v as RegulatorySource })}>
            <SelectTrigger className="w-full" aria-label="Fonte normativa">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {REGULATORY_SOURCE_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            aria-label="Articolo o riferimento"
            placeholder="Es. Art. 21, par. 2, lett. c)"
            value={ref.article}
            onChange={(e) => update(index, { article: e.target.value })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Rimuovi riferimento"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            <Trash2 aria-hidden />
          </Button>
          <Input
            className="sm:col-span-2"
            aria-label="Sintesi del riferimento (facoltativa)"
            placeholder="Sintesi (facoltativa)"
            value={ref.summary ?? ""}
            onChange={(e) => update(index, { summary: e.target.value })}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...value, { source: "direttiva_ue_2022_2555", article: "" }])}
      >
        <Plus aria-hidden /> Aggiungi riferimento
      </Button>
      <p className="text-xs text-muted-foreground">
        Indica solo riferimenti verificati sulle fonti ufficiali. I riferimenti senza articolo non vengono salvati.
      </p>
    </div>
  );
}
