"use client";

import { Loader2, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { FormField, fieldAria } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MIN_PASSWORD_LENGTH, authErrorMessage, validateEmail, validatePassword } from "@/lib/auth/errors";
import { DEFAULT_AUTHENTICATED_ROUTE } from "@/lib/auth/routes";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { FormError } from "./auth-card";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    const invalid = validateEmail(trimmed);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    const { error: resetError } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });
    setPending(false);
    // Per non rivelare quali email sono registrate, il messaggio è lo stesso in ogni caso,
    // salvo i limiti di frequenza.
    if (resetError && resetError.code?.startsWith("over_")) {
      setError(authErrorMessage(resetError));
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="space-y-3 text-sm">
        <MailCheck className="size-6 text-success" aria-hidden />
        <p>
          Se esiste un account con questo indirizzo, riceverai un&apos;email con il link per impostare una nuova
          password.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormError message={error} />
      <FormField id="email" label="Email">
        <Input {...fieldAria("email")} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormField>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Invia link di recupero
      </Button>
    </form>
  );
}

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const invalid = validatePassword(password) ?? (password !== confirm ? "Le password non coincidono." : undefined);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    const { error: updateError } = await getSupabaseBrowserClient().auth.updateUser({ password });
    setPending(false);
    if (updateError) {
      setError(authErrorMessage(updateError));
      return;
    }
    toast.success("Password aggiornata");
    router.replace(DEFAULT_AUTHENTICATED_ROUTE);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormError message={error} />
      <FormField id="password" label="Nuova password" hint={`Almeno ${MIN_PASSWORD_LENGTH} caratteri, con lettere e numeri.`}>
        <Input
          {...fieldAria("password")}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormField>
      <FormField id="confirm" label="Conferma password">
        <Input
          {...fieldAria("confirm")}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Salva password
      </Button>
    </form>
  );
}
