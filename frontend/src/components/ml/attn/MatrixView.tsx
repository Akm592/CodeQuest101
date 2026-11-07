// A small labelled matrix, for the attention maths. Numbers to 4 decimals at most.

import * as React from "react";

import { C } from "../colors";

const fmt = (v: number) => (v === -Infinity ? "−∞" : String(+v.toFixed(4)));

export const MatrixView: React.FC<{
  name: React.ReactNode;
  m: number[][];
  rows?: readonly string[];
  cols?: readonly string[];
  tone?: string;
  /** Shade cells by value (0–1), for attention weights. */
  heat?: boolean;
}> = ({ name, m, rows, cols, tone = C.teal, heat }) => (
  <div className="inline-block align-top">
    <p className="mb-1 font-sans text-xs font-semibold" style={{ color: tone }}>
      {name}
    </p>
    <table className="border-separate border-spacing-0.5 font-mono text-[12px] tabular-nums">
      {cols && (
        <thead>
          <tr>
            {rows && <th />}
            {cols.map((c) => (
              <th
                key={c}
                className="px-1 text-center font-sans text-[10px] font-normal text-muted-foreground"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {m.map((r, i) => (
          <tr key={i}>
            {rows && (
              <th className="pr-1.5 text-right font-sans text-[11px] font-normal text-muted-foreground">
                {rows[i]}
              </th>
            )}
            {r.map((v, j) => (
              <td
                key={j}
                className="min-w-[3.25rem] rounded px-1.5 py-0.5 text-right text-foreground"
                style={{
                  background:
                    heat && Number.isFinite(v)
                      ? `color-mix(in srgb, ${tone} ${Math.round(v * 70)}%, transparent)`
                      : "hsl(var(--muted) / 0.5)",
                  color: v === -Infinity ? C.muted : undefined,
                }}
              >
                {fmt(v)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
