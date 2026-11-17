"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SearchX,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { LoadDemoButton } from "@/components/common/load-demo-button";
import { LoadingBlock } from "@/components/common/loading-block";
import { StatusBadge } from "@/components/common/tone-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DEFAULT_CONTROL_QUERY,
  filterAndSortControls,
  type ControlQuery,
  type SortKey,
} from "@/lib/domain/control-filters";
import { evidenceCountByControl } from "@/lib/domain/selectors";
import { formatDate } from "@/lib/format";
import {
  CONTROL_CATEGORIES,
  CONTROL_CATEGORY_LABEL,
  CONTROL_STATUSES,
  CONTROL_STATUS_META,
  REGULATORY_SOURCE_LABEL,
} from "@/lib/models/labels";
import type { SecurityControl } from "@/lib/models/types";
import { useAppData } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";
import { ControlFormDialog } from "./control-form-dialog";
import { DeleteControlDialog } from "./delete-control-dialog";

function SortableHead({
  label,
  sortKey,
  query,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  query: ControlQuery;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = query.sortKey === sortKey;
  const Icon = !active ? ArrowUpDown : query.sortDirection === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead
      className={className}
      aria-sort={active ? (query.sortDirection === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
          active && "text-foreground",
        )}
      >
        {label}
        <Icon className={cn("size-3", !active && "opacity-40")} aria-hidden />
      </button>
    </TableHead>
  );
}

export function ControlsTable() {
  const data = useAppData();
  const router = useRouter();
  const [query, setQuery] = useState<ControlQuery>(DEFAULT_CONTROL_QUERY);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SecurityControl | undefined>();
  const [deleting, setDeleting] = useState<SecurityControl | null>(null);

  const rows = useMemo(
    () => (data ? filterAndSortControls(data.controls, query) : []),
    [data, query],
  );

  if (!data) return <LoadingBlock rows={6} />;

  const evidenceCounts = evidenceCountByControl(data);
  const hasFilters = query.search !== "" || query.category !== "all" || query.status !== "all";

  const onSort = (sortKey: SortKey) =>
    setQuery((q) => ({
      ...q,
      sortKey,
      sortDirection: q.sortKey === sortKey && q.sortDirection === "asc" ? "desc" : "asc",
    }));

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (control: SecurityControl) => {
    setEditing(control);
    setFormOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            aria-label="Cerca nei controlli"
            placeholder="Cerca per ID, nome, responsabile, riferimento…"
            className="pl-8"
            value={query.search}
            onChange={(e) => setQuery((q) => ({ ...q, search: e.target.value }))}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={query.category}
            onValueChange={(v) => setQuery((q) => ({ ...q, category: v as ControlQuery["category"] }))}
          >
            <SelectTrigger className="w-full sm:w-52" aria-label="Filtra per categoria">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le categorie</SelectItem>
              {CONTROL_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CONTROL_CATEGORY_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={query.status}
            onValueChange={(v) => setQuery((q) => ({ ...q, status: v as ControlQuery["status"] }))}
          >
            <SelectTrigger className="w-full sm:w-40" aria-label="Filtra per stato">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              {CONTROL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {CONTROL_STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery((q) => ({ ...DEFAULT_CONTROL_QUERY, sortKey: q.sortKey, sortDirection: q.sortDirection }))}
            >
              <X aria-hidden /> Azzera filtri
            </Button>
          )}
          <Button onClick={openCreate} className="sm:ml-auto lg:ml-0">
            <Plus aria-hidden /> Nuovo controllo
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {rows.length === data.controls.length
          ? `${data.controls.length} controlli`
          : `${rows.length} di ${data.controls.length} controlli`}
      </p>

      {data.controls.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Il registro è vuoto"
          description="Aggiungi il primo controllo di sicurezza, oppure carica 10 controlli di esempio per esplorare l'applicazione."
        >
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={openCreate}>
              <Plus aria-hidden /> Nuovo controllo
            </Button>
            <LoadDemoButton />
          </div>
        </EmptyState>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nessun controllo corrisponde ai filtri"
          description="Prova a modificare la ricerca o ad azzerare i filtri."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <SortableHead label="ID" sortKey="code" query={query} onSort={onSort} className="w-28" />
                <SortableHead label="Controllo" sortKey="name" query={query} onSort={onSort} />
                <SortableHead label="Categoria" sortKey="category" query={query} onSort={onSort} className="hidden lg:table-cell" />
                <TableHead className="hidden 2xl:table-cell">Riferimento</TableHead>
                <SortableHead label="Stato" sortKey="status" query={query} onSort={onSort} />
                <SortableHead label="Responsabile" sortKey="owner" query={query} onSort={onSort} className="hidden md:table-cell" />
                <TableHead className="hidden text-right sm:table-cell">Evidenze</TableHead>
                <SortableHead label="Ultima verifica" sortKey="lastVerifiedAt" query={query} onSort={onSort} className="hidden md:table-cell" />
                <TableHead className="w-10">
                  <span className="sr-only">Azioni</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((control) => {
                const [firstRef, ...otherRefs] = control.regulatoryReferences;
                return (
                  <TableRow key={control.id} className="group">
                    <TableCell className="font-mono text-xs text-muted-foreground">{control.code}</TableCell>
                    <TableCell className="min-w-64 max-w-96 whitespace-normal">
                      <Link
                        href={`/controls/${control.id}`}
                        className="font-medium underline-offset-4 outline-none hover:underline focus-visible:underline"
                      >
                        {control.name}
                      </Link>
                      {control.description && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">{control.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {CONTROL_CATEGORY_LABEL[control.category]}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground 2xl:table-cell">
                      {firstRef ? (
                        <span title={control.regulatoryReferences.map((r) => `${REGULATORY_SOURCE_LABEL[r.source]} – ${r.article}`).join("\n")}>
                          {firstRef.article}
                          {otherRefs.length > 0 && <span className="ml-1 text-muted-foreground/70">+{otherRefs.length}</span>}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={control.status} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{control.owner}</TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {evidenceCounts.get(control.id) ?? 0}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
                      {formatDate(control.lastVerifiedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Azioni per ${control.code}`}>
                            <MoreHorizontal aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => router.push(`/controls/${control.id}`)}>
                            <Eye aria-hidden /> Visualizza dettagli
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEdit(control)}>
                            <Pencil aria-hidden /> Modifica
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(control)}>
                            <Trash2 aria-hidden /> Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ControlFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        data={data}
        control={editing}
        onCreated={(c) => router.push(`/controls/${c.id}`)}
      />
      <DeleteControlDialog
        control={deleting}
        evidenceCount={deleting ? (evidenceCounts.get(deleting.id) ?? 0) : 0}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  );
}
