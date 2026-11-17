"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FormField, fieldAria } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NIS2_CLASSIFICATION_LABEL } from "@/lib/models/labels";
import type { NIS2EntityClassification, Organization } from "@/lib/models/types";
import { actionErrorMessage, appActions } from "@/lib/store/app-store";

const CLASSIFICATIONS = Object.keys(NIS2_CLASSIFICATION_LABEL) as NIS2EntityClassification[];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization;
}

export function OrganizationDialog({ open, onOpenChange, organization }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <OrganizationForm organization={organization} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function OrganizationForm({ organization, onDone }: { organization: Organization; onDone: () => void }) {
  const [name, setName] = useState(organization.name);
  const [sector, setSector] = useState(organization.sector);
  const [classification, setClassification] = useState(organization.nis2Classification);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 120) {
      setError(trimmed ? "Massimo 120 caratteri." : "Inserisci il nome dell'organizzazione.");
      return;
    }
    setPending(true);
    try {
      await appActions.updateOrganization({
        name: trimmed,
        sector: sector.trim().slice(0, 120),
        nis2Classification: classification,
      });
      toast.success("Organizzazione aggiornata");
      onDone();
    } catch (err) {
      toast.error(actionErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <DialogHeader>
        <DialogTitle>Organizzazione</DialogTitle>
        <DialogDescription>Dati riportati nell&apos;intestazione dei report.</DialogDescription>
      </DialogHeader>
      <FormField id="org-name" label="Nome" required error={error}>
        <Input {...fieldAria("org-name", error)} value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <FormField id="org-sector" label="Settore">
        <Input {...fieldAria("org-sector")} placeholder="Es. Trasporti e logistica" value={sector} onChange={(e) => setSector(e.target.value)} />
      </FormField>
      <FormField
        id="org-classification"
        label="Classificazione NIS2 dichiarata"
        hint="Indicata dall'organizzazione: CyberProof non la determina."
      >
        <Select value={classification} onValueChange={(v) => setClassification(v as NIS2EntityClassification)}>
          <SelectTrigger id="org-classification" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLASSIFICATIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {NIS2_CLASSIFICATION_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Annulla
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          Salva
        </Button>
      </DialogFooter>
    </form>
  );
}
