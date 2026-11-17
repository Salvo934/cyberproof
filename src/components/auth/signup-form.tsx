"use client";

import { Loader2, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormField, fieldAria } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MIN_PASSWORD_LENGTH, authErrorMessage, validateEmail, validatePassword } from "@/lib/auth/errors";
import { DEFAULT_AUTHENTICATED_ROUTE } from "@/lib/auth/routes";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { FormError } from "./auth-card";

type Errors = Partial<Record<"organization" | "email" | "password", string>>;

export function SignupForm() {
  const router = useRouter();
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedOrg = organization.trim();
    const next: Errors = {
      organization: trimmedOrg ? (trimmedOrg.length > 120 ? "Massimo 120 caratteri." : undefined) : "Inserisci il nome dell'organizzazione.",
      email: validateEmail(trimmedEmail),
      password: validatePassword(password),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setPending(true);
    setFormError(null);
    const { data, error } = await getSupabaseBrowserClient().auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { organization_name: trimmedOrg },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${DEFAULT_AUTHENTICATED_ROUTE}`,
      },
    });
    setPending(false);

    if (error) {
      setFormError(authErrorMessage(error));
      return;
    }
    if (data.session) {
      // Conferma email disattivata nel progetto: l'utente è già autenticato.
      router.replace(DEFAULT_AUTHENTICATED_ROUTE);
      router.refresh();
      return;
    }
    setSentTo(trimmedEmail);
  };

  if (sentTo) {
    return (
      <div className="space-y-3 text-sm">
        <MailCheck className="size-6 text-success" aria-hidden />
        <p>
          Ti abbiamo inviato un&apos;email a <strong className="font-medium">{sentTo}</strong>. Apri il link per
          confermare l&apos;indirizzo e accedere.
        </p>
        <p className="text-xs text-muted-foreground">
          Se l&apos;email non arriva, controlla la cartella spam. Se esisteva già un account con questo indirizzo,
          non riceverai un nuovo messaggio: prova ad accedere o a reimpostare la password.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormError message={formError} />
      <FormField id="organization" label="Nome dell'organizzazione" error={errors.organization}>
        <Input
          {...fieldAria("organization", errors.organization)}
          autoComplete="organization"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
        />
      </FormField>
      <FormField id="email" label="Email" error={errors.email}>
        <Input
          {...fieldAria("email", errors.email)}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormField>
      <FormField
        id="password"
        label="Password"
        error={errors.password}
        hint={`Almeno ${MIN_PASSWORD_LENGTH} caratteri, con lettere e numeri.`}
      >
        <Input
          {...fieldAria("password", errors.password)}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Crea account
      </Button>
    </form>
  );
}
