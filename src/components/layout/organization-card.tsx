"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { NIS2_CLASSIFICATION_LABEL } from "@/lib/models/labels";
import { useAppData } from "@/lib/store/app-store";

export function OrganizationCard() {
  const data = useAppData();

  if (!data) {
    return (
      <div className="space-y-1.5 px-2 py-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }

  const { organization } = data;
  return (
    <div className="px-2 py-1">
      <div className="flex items-center gap-1.5">
        <p className="truncate text-sm font-medium">{organization.name}</p>
        {organization.isDemo && (
          <span className="rounded border px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Demo
          </span>
        )}
      </div>
      <p className="truncate text-xs text-muted-foreground">
        {NIS2_CLASSIFICATION_LABEL[organization.nis2Classification]} (dichiarata)
      </p>
    </div>
  );
}
