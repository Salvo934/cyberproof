"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FormField, fieldAria } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authErrorMessage } from "@/lib/auth/errors";
import { safeNextPath } from "@/lib/auth/routes";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { FormError } from "./auth-card";

const LINK_ERROR = "Il link non è valido o è scaduto. Richiedine uno nuovo.";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(searchParams.get("error") === "link" ? LINK_ERROR : null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      setError("Inserisci email e password.");
      return;
    }
    setPending(true);
    setError(null);
    const { error: signInError } = await getSupabaseBrowserClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setError(authErrorMessage(signInError));
      setPending(false);
      return;
    }
    router.replace(safeNextPath(searchParams.get("next")));
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormError message={error} />
      <FormField id="email" label="Email">
        <Input
          {...fieldAria("email")}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormField>
      <FormField id="password" label="Password">
        <Input
          {...fieldAria("password")}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormField>
      <div className="flex justify-end">
        <Link href="/auth/forgot-password" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
          Password dimenticata?
        </Link>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Accedi
      </Button>
    </form>
  );
}
