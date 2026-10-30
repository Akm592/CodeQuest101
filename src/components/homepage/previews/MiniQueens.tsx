// 4-Queens backtracking at card size: squares the placed queens attack carry a
// faint wash, a rejected square is joined by a line to the queen attacking it,
// and an undo flashes the square the queen is lifted from.

import { Crown } from "lucide-react";

import type { NQueensStep } from "../../../lib/algorithms/nQueensSteps";
import { QUEENS_PREVIEW_SIZE } from "../../../lib/algorithms/previewStages";

const CELL = 30;
const N = QUEENS_PREVIEW_SIZE;
const ICON = 18;

export function MiniQueens({ step }: { step: NQueensStep }) {
  const attacked = new Set(step.attacked.map((c) => `${c.row},${c.col}`));
  const centre = (r: number, c: number) => ({ x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 });

  const squareFill = (r: number, c: number): string => {
    const focus = step.row === r && step.col === c;
    if (focus && step.action === "conflict") return "hsl(var(--viz-swap) / 0.4)";
    if (focus && step.action === "undo") return "hsl(var(--viz-swap) / 0.2)";
    if (focus && step.action === "place") return "hsl(var(--viz-current) / 0.3)";
    if (step.queens[r] === c) return "hsl(var(--viz-found) / 0.22)";
    if (attacked.has(`${r},${c}`)) return "hsl(var(--viz-visited) / 0.16)";
    return (r + c) % 2 === 0 ? "hsl(var(--viz-idle) / 0.12)" : "hsl(var(--viz-idle) / 0.05)";
  };

  const blocker = step.action === "conflict" && typeof step.conflictWith === "number" ? step.conflictWith : null;

  return (
    <svg viewBox={`0 0 ${N * CELL} ${N * CELL}`} className="h-full w-full" aria-hidden="true">
      {Array.from({ length: N }, (_, r) =>
        Array.from({ length: N }, (_, c) => (
          <rect
            key={`sq-${r}-${c}`}
            x={c * CELL}
            y={r * CELL}
            width={CELL}
            height={CELL}
            fill={squareFill(r, c)}
            className="transition-[fill] duration-300"
          />
        )),
      )}

      {blocker !== null && (
        <line
          x1={centre(step.row, step.col).x}
          y1={centre(step.row, step.col).y}
          x2={centre(blocker, step.queens[blocker]).x}
          y2={centre(blocker, step.queens[blocker]).y}
          stroke="hsl(var(--viz-swap))"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
      )}

      {step.queens.map((c, r) => (
        <Crown
          key={`q-${r}`}
          x={c * CELL + (CELL - ICON) / 2}
          y={r * CELL + (CELL - ICON) / 2}
          width={ICON}
          height={ICON}
          color="hsl(var(--viz-found))"
          strokeWidth={2.25}
        />
      ))}

      {/* The rejected square gets a ghost queen, so "tried here" is visible. */}
      {step.action === "conflict" && (
        <Crown
          x={step.col * CELL + (CELL - ICON) / 2}
          y={step.row * CELL + (CELL - ICON) / 2}
          width={ICON}
          height={ICON}
          color="hsl(var(--viz-swap))"
          strokeWidth={2}
          opacity={0.7}
        />
      )}

      <rect x={0.5} y={0.5} width={N * CELL - 1} height={N * CELL - 1} fill="none" stroke="hsl(var(--border))" />
    </svg>
  );
}
