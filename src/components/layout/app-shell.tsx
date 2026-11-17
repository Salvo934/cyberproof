"use client";

import { Lock, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Brand } from "./brand";
import { DataGate } from "./data-gate";
import { OrganizationCard } from "./organization-card";
import { SettingsMenu } from "./settings-menu";
import { SidebarNav } from "./sidebar-nav";

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className="px-1 pt-1">
        <Brand />
      </div>
      <OrganizationCard />
      <Separator />
      <SidebarNav onNavigate={onNavigate} />
      <div className="mt-auto space-y-2">
        <p className="flex items-start gap-1.5 px-2 text-[11px] leading-4 text-muted-foreground">
          <Lock className="mt-0.5 size-3 shrink-0" aria-hidden />
          Dati e documenti visibili solo alla tua organizzazione.
        </p>
        <SettingsMenu />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-svh w-full">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 border-r bg-sidebar text-sidebar-foreground md:block">
        <SidebarBody />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Apri menu di navigazione">
                <Menu aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 gap-0 bg-sidebar p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigazione</SheetTitle>
                <SheetDescription>Menu principale di CyberProof</SheetDescription>
              </SheetHeader>
              <SidebarBody onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <Brand />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          <DataGate>{children}</DataGate>
        </main>
      </div>
    </div>
  );
}
