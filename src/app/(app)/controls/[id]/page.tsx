import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingBlock } from "@/components/common/loading-block";
import { ControlDetail } from "@/components/controls/control-detail";

export const metadata: Metadata = { title: "Dettaglio controllo" };

export default function ControlDetailPage({ params }: PageProps<"/controls/[id]">) {
  return (
    <Suspense fallback={<LoadingBlock rows={5} />}>
      {params.then(({ id }) => (
        <ControlDetail controlId={id} />
      ))}
    </Suspense>
  );
}
