"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavItemActive } from "./nav-items";

interface SidebarNavProps {
  onNavigate?: () => void;
}

/**
 * Il percorso corrente è un dato di runtime: la navigazione viene renderizzata
 * staticamente senza stato attivo e poi completata lato client.
 */
export function SidebarNav(props: SidebarNavProps) {
  return (
    <Suspense fallback={<NavLinks pathname={null} {...props} />}>
      <ActiveNavLinks {...props} />
    </Suspense>
  );
}

function ActiveNavLinks(props: SidebarNavProps) {
  const pathname = usePathname();
  return <NavLinks pathname={pathname} {...props} />;
}

function NavLinks({ pathname, onNavigate }: SidebarNavProps & { pathname: string | null }) {
  return (
    <nav aria-label="Navigazione principale" className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname !== null && isNavItemActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50",
              active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
