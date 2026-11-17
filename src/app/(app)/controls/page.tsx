import type { Metadata } from "next";
import { ControlsTable } from "@/components/controls/controls-table";
import { Disclaimer } from "@/components/common/disclaimer";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Registro controlli" };

export default function ControlsPage() {
  return (
    <>
      <PageHeader
        title="Registro controlli"
        description="Elenco dei controlli di sicurezza e del relativo stato di documentazione."
      />
      <ControlsTable />
      <Disclaimer className="mt-6">
        I controlli precaricati sono esempi dimostrativi e non costituiscono una checklist completa
        o ufficiale degli obblighi previsti dalla Direttiva (UE) 2022/2555 o dal D.Lgs. 138/2024.
      </Disclaimer>
    </>
  );
}
