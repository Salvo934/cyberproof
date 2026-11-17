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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  EMPTY_CONTROL_INPUT,
  controlToInput,
  normalizeControlInput,
  suggestControlCode,
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
import { RepositoryError } from "@/lib/persistence/supabase-repository";
import { actionErrorMessage, appActions } from "@/lib/store/app-store";
import type { ControlTemplate } from "@/lib/data/control-catalog";
import { ControlNameCombobox } from "./control-name-combobox";
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
  const [pending, setPending] = useState(false);
  // Il codice proposto si aggiorna con la categoria finché l'utente non lo modifica a mano.
  const [codeTouched, setCodeTouched] = useState(isEdit);
  const [prefilledFrom, setPrefilledFrom] = useState<string | null>(null);

  const applyTemplate = (template: ControlTemplate) => {
    setValues((v) => {
      const refKey = (r: { source: string; article: string }) => `${r.source}|${r.article}`;
      const known = new Set(v.regulatoryReferences.map(refKey));
      return {
        ...v,
        name: template.name,
        category: template.category,
        description: v.description.trim() ? v.description : template.description,
        regulatoryReferences: [
          ...v.regulatoryReferences,
          ...template.regulatoryReferences.filter((r) => !known.has(refKey(r))).map((r) => ({ ...r })),
        ],
        code: codeTouched
          ? v.code
          : suggestControlCode(
              data.controls.filter((c) => c.id !== control?.id),
              template.category,
            ),
      };
    });
    setErrors((e) => ({ ...e, name: undefined, code: undefined }));
    setPrefilledFrom(template.name);
  };

  const set = <K extends keyof ControlInput>(key: K, value: ControlInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const input = normalizeControlInput(values);
    const validation = validateControlInput(input, data.controls, control?.id);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setPending(true);
    try {
      if (control) {
        await appActions.updateControl(control.id, input);
        toast.success("Controllo aggiornato");
      } else {
        const created = await appActions.createControl(input);
        toast.success("Controllo aggiunto al registro");
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof RepositoryError && error.field === "code") {
        setErrors({ code: error.message });
      } else {
        toast.error(actionErrorMessage(error));
      }
    } finally {
      setPending(false);
    }
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
            onChange={(e) => {
              setCodeTouched(true);
              set("code", e.target.value);
            }}
            autoComplete="off"
          />
        </FormField>
        <FormField id="name" label="Nome" required error={errors.name}>
          <ControlNameCombobox
            id="name"
            value={values.name}
            onChange={(name) => {
              set("name", name);
              setPrefilledFrom(null);
            }}
            onSelectTemplate={applyTemplate}
            existingNames={data.controls.filter((c) => c.id !== control?.id).map((c) => c.name)}
            invalid={Boolean(errors.name)}
            describedBy={errors.name ? "name-error" : undefined}
          />
        </FormField>
      </div>
      {prefilledFrom && (
        <p className="-mt-2 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground" role="status">
          Categoria, descrizione e riferimenti normativi sono stati proposti dal suggerimento: verificali e
          adattali alla tua organizzazione. I riferimenti sono indicativi.
        </p>
      )}

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
          <Select
            value={values.category}
            onValueChange={(v) => {
              const category = v as ControlInput["category"];
              set("category", category);
              if (!codeTouched) set("code", suggestControlCode(data.controls, category));
            }}
          >
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
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
          Annulla
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {isEdit ? "Salva modifiche" : "Aggiungi controllo"}
        </Button>
      </DialogFooter>
    </form>
  );
}
