import type { Metadata } from "next";
import { Disclaimer } from "@/components/common/disclaimer";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Panoramica dello stato di documentazione dei controlli di sicurezza registrati."
      />
      <DashboardOverview />
      <Disclaimer className="mt-6" />
    </>
  );
}
