import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo CyberProof su tessera bianca arrotondata: resta leggibile sia in tema
 * chiaro sia in tema scuro. `unoptimized` perché è già alla risoluzione giusta
 * (e su Cloudflare evita di richiedere il servizio Images).
 */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={size}
      height={size}
      unoptimized
      priority
      className={cn("shrink-0 rounded-[22%] ring-1 ring-foreground/10", className)}
    />
  );
}
