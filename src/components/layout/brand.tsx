import Link from "next/link";
import { Logo } from "./logo";

export function Brand() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 rounded-md px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <Logo size={28} />
      <span className="text-sm font-semibold tracking-tight">CyberProof</span>
    </Link>
  );
}
