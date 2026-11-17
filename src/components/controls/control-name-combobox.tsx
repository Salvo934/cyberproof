"use client";

import { Check, Sparkles } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { CONTROL_CATALOG, searchControlCatalog, type ControlTemplate } from "@/lib/data/control-catalog";
import { CONTROL_CATEGORY_LABEL } from "@/lib/models/labels";
import { cn } from "@/lib/utils";

interface ControlNameComboboxProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSelectTemplate: (template: ControlTemplate) => void;
  /** Nomi già presenti nel registro, segnalati nell'elenco. */
  existingNames: string[];
  invalid?: boolean;
  describedBy?: string;
}

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

/**
 * Campo nome con testo libero + elenco di controlli suggeriti (pattern ARIA combobox).
 * Invio seleziona un suggerimento solo se evidenziato con le frecce; altrimenti invia il form.
 */
export function ControlNameCombobox({
  id,
  value,
  onChange,
  onSelectTemplate,
  existingNames,
  invalid,
  describedBy,
}: ControlNameComboboxProps) {
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const results = useMemo(() => searchControlCatalog(value), [value]);
  const existing = useMemo(() => new Set(existingNames.map(normalize)), [existingNames]);
  const exactMatch = results.length === 1 && normalize(results[0].name) === normalize(value);
  const showList = open && results.length > 0 && !exactMatch;

  const select = (template: ControlTemplate) => {
    onSelectTemplate(template);
    setOpen(false);
    setActive(-1);
  };

  const move = (delta: number) => {
    if (!showList) {
      setOpen(true);
      return;
    }
    const next = (active + delta + results.length) % results.length;
    setActive(next);
    listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        move(-1);
        break;
      case "Enter":
        if (showList && active >= 0) {
          event.preventDefault();
          select(results[active]);
        }
        break;
      case "Escape":
        if (showList) {
          // Chiude solo l'elenco, non il dialog.
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          setActive(-1);
        }
        break;
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        placeholder="Scrivi un nome o scegli dall'elenco"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setActive(-1);
        }}
        onKeyDown={handleKeyDown}
      />
      {showList && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md">
          <p className="flex items-center gap-1.5 border-b px-3 py-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="size-3" aria-hidden />
            {results.length === CONTROL_CATALOG.length ? "Controlli comuni" : `${results.length} suggerimenti`} · puoi
            anche scrivere un nome libero
          </p>
          <ul ref={listRef} id={listId} role="listbox" aria-label="Controlli suggeriti" className="max-h-60 overflow-y-auto p-1">
            {results.map((template, index) => {
              const alreadyPresent = existing.has(normalize(template.name));
              return (
                <li
                  key={template.name}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  // mousedown invece di click: evita che il blur dell'input chiuda l'elenco prima della selezione.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(template);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                    index === active && "bg-accent text-accent-foreground",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{template.name}</span>
                  {alreadyPresent ? (
                    <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                      <Check className="size-3" aria-hidden /> nel registro
                    </span>
                  ) : (
                    <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
                      {CONTROL_CATEGORY_LABEL[template.category]}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
