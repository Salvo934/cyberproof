import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Registrati" };

export default function SignupPage() {
  return (
    <AuthCard
      title="Crea un account"
      description="Ogni account gestisce il registro di una singola organizzazione."
      footer={
        <>
          Hai già un account?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Accedi
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
