"use client";

import { CircleAlert, CircleCheck, CircleDot, OctagonAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AttentionItem, AttentionSeverity } from "@/lib/domain/dashboard";
import { cn } from "@/lib/utils";

const SEVERITY_META: Record<AttentionSeverity, { label: string; icon: typeof CircleAlert; className: string }> = {
  critical: { label: "Critico", icon: OctagonAlert, className: "text-destructive" },
  warning: { label: "Attenzione", icon: CircleAlert, className: "text-warning" },
  info: { label: "Da avviare", icon: CircleDot, className: "text-muted-foreground" },
};

const INITIAL_VISIBLE = 8;

export function AttentionList({ items }: { items: AttentionItem[] }) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
        <CircleCheck className="size-4 text-success" aria-hidden />
        Nessuna attività aperta secondo le regole attuali.
      </div>
    );
  }

  const visible = expanded ? items : items.slice(0, INITIAL_VISIBLE);

  return (
    <>
      <ul className="divide-y">
        {visible.map((item) => {
          const meta = SEVERITY_META[item.severity];
          const Icon = meta.icon;
          return (
            <li key={`${item.control.id}-${item.reason}`}>
              <Link
                href={`/controls/${item.control.id}`}
                className="flex items-start gap-3 px-4 py-2.5 transition-colors outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
              >
                <Icon className={cn("mt-0.5 size-4 shrink-0", meta.className)} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="mr-1.5 font-mono text-xs text-muted-foreground">{item.control.code}</span>
                    <span className="font-medium">{item.control.name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{item.message}</p>
                </div>
                <span className={cn("shrink-0 text-xs font-medium", meta.className)}>{meta.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {items.length > INITIAL_VISIBLE && (
        <div className="border-t px-4 py-2">
          <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Mostra meno" : `Mostra tutte (${items.length})`}
          </Button>
        </div>
      )}
    </>
  );
}
