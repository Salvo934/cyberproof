import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export function Brand() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 rounded-md px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
        <ShieldCheck className="size-4" aria-hidden />
      </span>
      <span className="text-sm font-semibold tracking-tight">CyberProof</span>
    </Link>
  );
}
