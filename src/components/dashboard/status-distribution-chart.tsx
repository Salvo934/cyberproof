"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CONTROL_STATUS_META, type Tone } from "@/lib/models/labels";
import type { ControlStatus } from "@/lib/models/types";

const TONE_FILL: Record<Tone, string> = {
  neutral: "var(--muted-foreground)",
  info: "var(--info)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--destructive)",
};

interface Datum {
  status: ControlStatus;
  label: string;
  count: number;
}

interface TooltipPayload {
  active?: boolean;
  payload?: { payload: Datum }[];
}

function ChartTooltip({ active, payload, total }: TooltipPayload & { total: number }) {
  const datum = active ? payload?.[0]?.payload : undefined;
  if (!datum) return null;
  const share = total > 0 ? Math.round((datum.count / total) * 100) : 0;
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md">
      <p className="font-medium">{datum.label}</p>
      <p className="text-muted-foreground tabular-nums">
        {datum.count} {datum.count === 1 ? "controllo" : "controlli"} · {share}% del registro
      </p>
    </div>
  );
}

/** Distribuzione dei controlli per stato della documentazione (barre orizzontali). */
export function StatusDistributionChart({ data }: { data: { status: ControlStatus; count: number }[] }) {
  const rows: Datum[] = data.map((d) => ({ ...d, label: CONTROL_STATUS_META[d.status].label }));
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <figure>
      <div className="h-48 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 0 }} barCategoryGap={8}>
            <XAxis type="number" hide allowDecimals={false} domain={[0, "dataMax"]} />
            <YAxis
              type="category"
              dataKey="label"
              width={104}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={<ChartTooltip total={total} />}
              isAnimationActive={false}
            />
            <Bar dataKey="count" barSize={20} radius={[0, 4, 4, 0]} minPointSize={2} isAnimationActive={false}>
              {rows.map((r) => (
                <Cell key={r.status} fill={TONE_FILL[CONTROL_STATUS_META[r.status].tone]} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                className="tabular-nums"
                style={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Vista testuale equivalente per tecnologie assistive. */}
      <table className="sr-only">
        <caption>Distribuzione dei controlli per stato della documentazione</caption>
        <thead>
          <tr>
            <th scope="col">Stato</th>
            <th scope="col">Controlli</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.status}>
              <th scope="row">{r.label}</th>
              <td>{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
