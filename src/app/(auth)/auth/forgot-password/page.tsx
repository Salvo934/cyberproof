import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Recupero password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Recupera la password"
      description="Inserisci l'email dell'account: ti invieremo un link per impostarne una nuova."
      footer={
        <Link href="/login" className="underline-offset-4 hover:underline">
          Torna all&apos;accesso
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
