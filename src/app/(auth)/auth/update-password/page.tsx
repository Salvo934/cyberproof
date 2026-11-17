import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { UpdatePasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Nuova password" };

export default function UpdatePasswordPage() {
  return (
    <AuthCard title="Imposta una nuova password">
      <UpdatePasswordForm />
    </AuthCard>
  );
}
