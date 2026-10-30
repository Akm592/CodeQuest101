// Edit distance "cat" → "cut", at card size. Same colour language as the
// Dynamic Programming page: the cell being written, the neighbours it reads
// (dashed), the one it took (solid), then the traceback path in green.

import type { DpStep, DpTableLabels } from "../../../lib/algorithms/dpSteps";

const CELL = 22;
const GAP = 3;
const PITCH = CELL + GAP;

const centre = (row: number, col: number) => ({
  x: (col + 1) * PITCH + CELL / 2,
  y: (row + 1) * PITCH + CELL / 2,
});

interface MiniDpTableProps {
  step: DpStep;
  labels: DpTableLabels;
}

export function MiniDpTable({ step, labels }: MiniDpTableProps) {
  const { rowHeader, colHeader } = labels;
  const size = { w: (colHeader.length + 1) * PITCH, h: (rowHeader.length + 1) * PITCH };
  const path = new Set((step.path ?? []).map((c) => `${c.row},${c.col}`));
  const from = new Set(step.from.map((c) => `${c.row},${c.col}`));
  const tracing = step.phase === "traceback" || step.phase === "done";

  // The grid starts zero-filled, so an interior cell is blank until the sweep
  // writes it — otherwise "not computed yet" reads as a computed 0.
  const filled = (r: number, c: number): boolean => {
    if (r === 0 || c === 0) return true;
    if (step.phase === "init") return false;
    if (step.phase !== "fill") return true;
    return r < step.row || (r === step.row && c <= step.col);
  };

  const fill = (r: number, c: number): string => {
    const key = `${r},${c}`;
    if (step.phase === "fill" && step.row === r && step.col === c) return "hsl(var(--viz-current) / 0.35)";
    if (tracing && path.has(key)) return "hsl(var(--viz-found) / 0.3)";
    if (step.phase === "fill" && from.has(key)) return "hsl(var(--viz-compare) / 0.25)";
    return filled(r, c) ? "hsl(var(--viz-visited) / 0.14)" : "hsl(var(--viz-idle) / 0.1)";
  };

  return (
    <svg viewBox={`0 0 ${size.w} ${size.h}`} className="h-full w-full" aria-hidden="true">
      {colHeader.map((label, c) => (
        <text
          key={`col-${c}`}
          x={(c + 1) * PITCH + CELL / 2}
          y={CELL / 2 + 4}
          textAnchor="middle"
          className="font-mono text-[11px] font-semibold"
          fill="hsl(var(--viz-pointer))"
        >
          {label}
        </text>
      ))}
      {rowHeader.map((label, r) => (
        <text
          key={`row-${r}`}
          x={CELL / 2}
          y={(r + 1) * PITCH + CELL / 2 + 4}
          textAnchor="middle"
          className="font-mono text-[11px] font-semibold"
          fill="hsl(var(--viz-pointer))"
        >
          {label}
        </text>
      ))}

      {step.grid.map((row, r) =>
        row.map((value, c) => (
          <g key={`cell-${r}-${c}`}>
            <rect
              x={(c + 1) * PITCH}
              y={(r + 1) * PITCH}
              width={CELL}
              height={CELL}
              rx={4}
              fill={fill(r, c)}
              className="transition-[fill] duration-300"
            />
            {filled(r, c) && (
              <text
                x={(c + 1) * PITCH + CELL / 2}
                y={(r + 1) * PITCH + CELL / 2 + 4}
                textAnchor="middle"
                className="font-mono text-[11px]"
                fill="hsl(var(--foreground))"
              >
                {value}
              </text>
            )}
          </g>
        )),
      )}

      {step.phase === "fill" &&
        step.from.map((src) => {
          const a = centre(src.row, src.col);
          const b = centre(step.row, step.col);
          const chosen = step.chosen?.row === src.row && step.chosen?.col === src.col;
          return (
            <line
              key={`from-${src.row}-${src.col}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={chosen ? "hsl(var(--viz-current))" : "hsl(var(--viz-compare))"}
              strokeWidth={chosen ? 2 : 1}
              strokeDasharray={chosen ? undefined : "3 2"}
              opacity={chosen ? 0.95 : 0.6}
            />
          );
        })}

      {tracing &&
        (step.path ?? []).slice(0, -1).map((cell, i) => {
          const next = (step.path ?? [])[i + 1];
          const a = centre(cell.row, cell.col);
          const b = centre(next.row, next.col);
          return (
            <line
              key={`path-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="hsl(var(--viz-found))"
              strokeWidth={2}
              opacity={0.9}
            />
          );
        })}
    </svg>
  );
}
