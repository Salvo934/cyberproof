"use client";

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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  EMPTY_CONTROL_INPUT,
  controlToInput,
  createControl,
  normalizeControlInput,
  suggestControlCode,
  updateControl,
  validateControlInput,
  type ControlFieldErrors,
  type ControlInput,
} from "@/lib/domain/controls";
import {
  CONTROL_CATEGORIES,
  CONTROL_CATEGORY_LABEL,
  CONTROL_STATUSES,
  CONTROL_STATUS_META,
  IMPLEMENTATION_META,
  IMPLEMENTATION_STATUSES,
} from "@/lib/models/labels";
import type { AppData, SecurityControl } from "@/lib/models/types";
import { updateAppData } from "@/lib/store/app-store";
import { RegulatoryReferencesEditor } from "./regulatory-references-editor";

interface ControlFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AppData;
  /** Se presente, il dialog modifica questo controllo; altrimenti ne crea uno nuovo. */
  control?: SecurityControl;
  onCreated?: (control: SecurityControl) => void;
}

export function ControlFormDialog(props: ControlFormDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        {/* Il form viene rimontato a ogni apertura, così riparte dai valori correnti. */}
        {props.open && <ControlForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function ControlForm({ onOpenChange, data, control, onCreated }: ControlFormDialogProps) {
  const isEdit = Boolean(control);
  const [values, setValues] = useState<ControlInput>(() =>
    control ? controlToInput(control) : { ...EMPTY_CONTROL_INPUT, code: suggestControlCode(data.controls) },
  );
  const [errors, setErrors] = useState<ControlFieldErrors>({});

  const set = <K extends keyof ControlInput>(key: K, value: ControlInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const input = normalizeControlInput(values);
    const validation = validateControlInput(input, data.controls, control?.id);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    if (control) {
      updateAppData((d) => updateControl(d, control.id, input));
      toast.success("Controllo aggiornato");
    } else {
      let created: SecurityControl | undefined;
      updateAppData((d) => {
        const result = createControl(d, input);
        created = result.control;
        return result.data;
      });
      toast.success("Controllo aggiunto al registro");
      if (created) onCreated?.(created);
    }
    onOpenChange(false);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Modifica controllo" : "Nuovo controllo"}</DialogTitle>
        <DialogDescription>
          I campi contrassegnati con * sono obbligatori. Lo stato descrive l&apos;avanzamento della
          documentazione, non la conformità normativa.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <FormField id="code" label="ID controllo" required error={errors.code}>
          <Input
            {...fieldAria("code", errors.code)}
            className="font-mono uppercase"
            value={values.code}
            onChange={(e) => set("code", e.target.value)}
            autoComplete="off"
          />
        </FormField>
        <FormField id="name" label="Nome" required error={errors.name}>
          <Input {...fieldAria("name", errors.name)} value={values.name} onChange={(e) => set("name", e.target.value)} />
        </FormField>
      </div>

      <FormField id="description" label="Descrizione" error={errors.description}>
        <Textarea
          {...fieldAria("description", errors.description)}
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="category" label="Categoria" required>
          <Select value={values.category} onValueChange={(v) => set("category", v as ControlInput["category"])}>
            <SelectTrigger id="category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTROL_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CONTROL_CATEGORY_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="owner" label="Responsabile" required error={errors.owner}>
          <Input
            {...fieldAria("owner", errors.owner)}
            placeholder="Es. Responsabile IT"
            value={values.owner}
            onChange={(e) => set("owner", e.target.value)}
          />
        </FormField>
        <FormField id="status" label="Stato della documentazione" required>
          <Select value={values.status} onValueChange={(v) => set("status", v as ControlInput["status"])}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTROL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {CONTROL_STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField
          id="implementation"
          label="Implementazione della misura"
          hint="Come dichiarata dal responsabile."
        >
          <Select
            value={values.implementation}
            onValueChange={(v) => set("implementation", v as ControlInput["implementation"])}
          >
            <SelectTrigger id="implementation" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMPLEMENTATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {IMPLEMENTATION_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField
          id="lastVerifiedAt"
          label="Data ultima verifica"
          error={errors.lastVerifiedAt}
          hint="Lascia vuoto se l'efficacia non è mai stata verificata."
        >
          <Input
            {...fieldAria("lastVerifiedAt", errors.lastVerifiedAt)}
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={values.lastVerifiedAt ?? ""}
            onChange={(e) => set("lastVerifiedAt", e.target.value || null)}
          />
        </FormField>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-sm font-medium">Riferimenti normativi</p>
        <RegulatoryReferencesEditor
          value={values.regulatoryReferences}
          onChange={(refs) => set("regulatoryReferences", refs)}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Annulla
        </Button>
        <Button type="submit">{isEdit ? "Salva modifiche" : "Aggiungi controllo"}</Button>
      </DialogFooter>
    </form>
  );
}
