"use client";

import { Building2, LogOut, Monitor, Moon, Settings2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { actionErrorMessage, appActions, useAppData } from "@/lib/store/app-store";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { OrganizationDialog } from "./organization-dialog";

function useUserEmail(): string | null {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data }) => active && setEmail(data.user?.email ?? null));
    return () => {
      active = false;
    };
  }, []);
  return email;
}

export function SettingsMenu() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const data = useAppData();
  const email = useUserEmail();
  const [orgOpen, setOrgOpen] = useState(false);

  const signOut = async () => {
    try {
      await appActions.signOut();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(actionErrorMessage(error));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
            <Settings2 aria-hidden />
            <span className="truncate">{email ?? "Impostazioni"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-60">
          {email && (
            <>
              <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem disabled={!data} onSelect={() => setOrgOpen(true)}>
            <Building2 aria-hidden /> Organizzazione
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Tema</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light">
              <Sun aria-hidden /> Chiaro
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon aria-hidden /> Scuro
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Monitor aria-hidden /> Sistema
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={signOut}>
            <LogOut aria-hidden /> Esci
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {data && <OrganizationDialog open={orgOpen} onOpenChange={setOrgOpen} organization={data.organization} />}
    </>
  );
}
