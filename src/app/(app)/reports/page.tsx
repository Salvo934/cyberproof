import type { Metadata } from "next";
import { Disclaimer } from "@/components/common/disclaimer";
import { PageHeader } from "@/components/layout/page-header";
import { ReportExport } from "@/components/reports/report-export";

export const metadata: Metadata = { title: "Report" };

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Report"
        description="Riepilogo dei controlli e delle evidenze registrate, esportabile in PDF."
      />
      <ReportExport />
      <Disclaimer className="mt-6">
        Il report è uno strumento di supporto documentale e non costituisce una certificazione di
        conformità. La stessa nota è riportata nel PDF.
      </Disclaimer>
    </>
  );
}
