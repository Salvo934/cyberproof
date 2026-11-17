import { cn } from "@/lib/utils";
import {
  CONTROL_STATUS_META,
  IMPLEMENTATION_META,
  type Tone,
} from "@/lib/models/labels";
import type { ControlStatus, ImplementationStatus } from "@/lib/models/types";

const TONE_CLASSES: Record<Tone, { badge: string; dot: string }> = {
  neutral: { badge: "text-muted-foreground", dot: "bg-muted-foreground/60" },
  info: { badge: "text-info", dot: "bg-info" },
  success: { badge: "text-success", dot: "bg-success" },
  warning: { badge: "text-warning", dot: "bg-warning" },
  danger: { badge: "text-destructive", dot: "bg-destructive" },
};

interface ToneBadgeProps {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}

/** Badge sobrio: bordo sottile + pallino colorato secondo il tono semantico. */
export function ToneBadge({ tone, children, className }: ToneBadgeProps) {
  const t = TONE_CLASSES[tone];
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-full border px-2 text-xs font-medium whitespace-nowrap",
        t.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", t.dot)} aria-hidden />
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ControlStatus }) {
  const meta = CONTROL_STATUS_META[status];
  return <ToneBadge tone={meta.tone}>{meta.label}</ToneBadge>;
}

export function ImplementationBadge({ value }: { value: ImplementationStatus }) {
  const meta = IMPLEMENTATION_META[value];
  return <ToneBadge tone={meta.tone}>{meta.label}</ToneBadge>;
}

export function toneDotClass(tone: Tone): string {
  return TONE_CLASSES[tone].dot;
}
