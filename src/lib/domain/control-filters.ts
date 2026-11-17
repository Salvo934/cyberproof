import { CONTROL_CATEGORY_LABEL, CONTROL_STATUSES } from "@/lib/models/labels";
import type { ControlCategory, ControlStatus, SecurityControl } from "@/lib/models/types";

export type SortKey = "code" | "name" | "category" | "status" | "owner" | "lastVerifiedAt";
export type SortDirection = "asc" | "desc";

export interface ControlQuery {
  search: string;
  category: ControlCategory | "all";
  status: ControlStatus | "all";
  sortKey: SortKey;
  sortDirection: SortDirection;
}

export const DEFAULT_CONTROL_QUERY: ControlQuery = {
  search: "",
  category: "all",
  status: "all",
  sortKey: "code",
  sortDirection: "asc",
};

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function matchesSearch(control: SecurityControl, term: string): boolean {
  if (!term) return true;
  const haystack = normalize(
    [
      control.code,
      control.name,
      control.description,
      control.owner,
      CONTROL_CATEGORY_LABEL[control.category],
      ...control.regulatoryReferences.map((r) => r.article),
    ].join(" "),
  );
  return normalize(term)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function compare(a: SecurityControl, b: SecurityControl, key: SortKey): number {
  switch (key) {
    case "status":
      return CONTROL_STATUSES.indexOf(a.status) - CONTROL_STATUSES.indexOf(b.status);
    case "category":
      return CONTROL_CATEGORY_LABEL[a.category].localeCompare(CONTROL_CATEGORY_LABEL[b.category], "it");
    case "lastVerifiedAt":
      // I controlli mai verificati finiscono in fondo in ordine crescente.
      return (a.lastVerifiedAt ?? "9999").localeCompare(b.lastVerifiedAt ?? "9999");
    default:
      return a[key].localeCompare(b[key], "it", { numeric: true });
  }
}

export function filterAndSortControls(controls: SecurityControl[], query: ControlQuery): SecurityControl[] {
  const direction = query.sortDirection === "asc" ? 1 : -1;
  return controls
    .filter(
      (c) =>
        (query.category === "all" || c.category === query.category) &&
        (query.status === "all" || c.status === query.status) &&
        matchesSearch(c, query.search.trim()),
    )
    .sort((a, b) => compare(a, b, query.sortKey) * direction || a.code.localeCompare(b.code));
}
