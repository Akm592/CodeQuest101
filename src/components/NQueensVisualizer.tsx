// N-Queens: the try / fail / undo loop made visible.
//
// A board on its own is not enough. Queens appearing and disappearing reads as
// flickering, not as a search, so there are three linked views:
//
//   1. the board, where squares the placed queens attack carry a faint wash, so
//      "why can't she go there" is answerable at a glance, and a rejected
//      square is joined by a line to the queen that blocks it — a conflict is a
//      relationship between two squares, not a property of one;
//   2. the recursion stack, pushed on place and popped on undo, which is what
//      turns "the board flickers" into "the algorithm is a stack";
//   3. a per-row ribbon of columns already tried, so the cost of exhaustive
//      search is legible.
//
// Step-backward is the point on this page: walking an undo in reverse is the
// clearest explanation of backtracking there is.

import { Crown } from "lucide-react";
import * as React from "react";

import { buildNQueensSteps, type NQueensStep } from "../lib/algorithms/nQueensSteps";
import { useAlgorithmPlayer } from "../hooks/useAlgorithmPlayer";
import { cn } from "../lib/utils";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Surface } from "./ui/surface";
import VisualizerControls from "./Visualizer/VisualizerControls";

type Mode = "first" | "all";

const CELL = 48;

const NQueensVisualizer: React.FC = () => {
  const [n, setN] = React.useState(6);
  const [mode, setMode] = React.useState<Mode>("first");

  // n=8 in all-solutions mode is ~15k steps, so the cap is generous but real.
  const { steps } = React.useMemo(
    () => buildNQueensSteps(n, { firstOnly: mode === "first", maxSteps: 20_000 }),
    [n, mode],
  );

  const player = useAlgorithmPlayer(steps, { initialDelayMs: 350 });
  const step: NQueensStep | null = player.current;

  const queens = step?.queens ?? [];
  const attacked = new Set((step?.attacked ?? []).map((c) => `${c.row},${c.col}`));

  const board = React.useMemo(
    () => Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => ({ r, c }))),
    [n],
  );

  // Columns already tried in each row, for the ribbon.
  const triedByRow = React.useMemo(() => {
    const tried = new Map<number, { col: number; ok: boolean }[]>();
    if (player.index < 0) return tried;
    for (const s of steps.slice(0, player.index + 1)) {
      if (s.action !== "conflict" && s.action !== "place") continue;
      const row = tried.get(s.row) ?? [];
      row.push({ col: s.col, ok: s.action === "place" });
      tried.set(s.row, row);
    }
    return tried;
  }, [steps, player.index]);

  const squareClass = (r: number, c: number): string => {
    const hasQueen = r < queens.length && queens[r] === c;
    const isFocus = step && step.row === r && step.col === c;

    if (hasQueen) return "bg-viz-found/25 ring-1 ring-viz-found";
    if (isFocus && step.action === "conflict") return "bg-viz-swap/40 ring-2 ring-viz-swap";
    if (isFocus && step.action === "undo") return "bg-viz-swap/20 ring-1 ring-viz-swap";
    if (isFocus) return "bg-viz-current/30 ring-2 ring-viz-current";
    if (attacked.has(`${r},${c}`)) return "bg-viz-visited/15";
    return (r + c) % 2 === 0 ? "bg-viz-idle/10" : "bg-viz-idle/[0.04]";
  };

  // The conflict line, in board coordinates.
  const conflictLine =
    step?.action === "conflict" && typeof step.conflictWith === "number"
      ? {
          from: { x: step.col * CELL + CELL / 2, y: step.row * CELL + CELL / 2 },
          to: {
            x: queens[step.conflictWith] * CELL + CELL / 2,
            y: step.conflictWith * CELL + CELL / 2,
          },
        }
      : null;

  return (
    <div className="flex w-full flex-col gap-6">
      <Surface variant="card" radius="2xl" className="p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="nq-size" className="mb-1 text-xs text-muted-foreground">Board size</Label>
            <Select value={String(n)} onValueChange={(v) => setN(Number(v))}>
              <SelectTrigger id="nq-size"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[4, 5, 6, 7, 8].map((size) => (
                  <SelectItem key={size} value={String(size)}>{size} × {size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="nq-mode" className="mb-1 text-xs text-muted-foreground">Search</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <SelectTrigger id="nq-mode"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="first">Stop at the first solution</SelectItem>
                <SelectItem value="all">Find every solution</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Surface variant="chip" radius="full" className="px-3 py-1.5 text-xs text-muted-foreground">
              Solutions found:{" "}
              <span className="font-mono font-bold text-viz-found">{step?.solutionCount ?? 0}</span>
            </Surface>
          </div>
        </div>
      </Surface>

      <div className="flex flex-col gap-6 lg:flex-row">
        <Surface variant="well" radius="2xl" className="overflow-x-auto p-4 sm:p-6">
          <div className="relative mx-auto" style={{ width: n * CELL, height: n * CELL }}>
            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${n}, ${CELL}px)` }}
            >
              {board.flat().map(({ r, c }) => (
                <div
                  key={`${r}-${c}`}
                  className={cn(
                    "flex items-center justify-center transition-colors duration-150",
                    squareClass(r, c),
                  )}
                  style={{ width: CELL, height: CELL }}
                >
                  {r < queens.length && queens[r] === c && (
                    <Crown className="h-6 w-6 text-viz-found" aria-label={`Queen at row ${r + 1}, column ${c + 1}`} />
                  )}
                </div>
              ))}
            </div>

            {conflictLine && (
              <svg
                className="pointer-events-none absolute inset-0"
                width={n * CELL}
                height={n * CELL}
                aria-hidden="true"
              >
                <line
                  x1={conflictLine.from.x}
                  y1={conflictLine.from.y}
                  x2={conflictLine.to.x}
                  y2={conflictLine.to.y}
                  stroke="hsl(var(--viz-swap))"
                  strokeWidth={2.5}
                  strokeDasharray="5 3"
                />
              </svg>
            )}
          </div>
        </Surface>

        {/* Recursion stack — what makes this a search rather than a flicker. */}
        <Surface variant="card" radius="2xl" className="min-w-[13rem] p-4 sm:p-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Recursion stack
          </h2>
          {queens.length === 0 ? (
            <p className="text-sm text-muted-foreground">Empty — nothing placed yet.</p>
          ) : (
            <ol className="flex flex-col-reverse gap-1.5">
              {queens.map((col, row) => (
                <li
                  key={row}
                  className={cn(
                    "rounded-md border px-3 py-1.5 font-mono text-xs",
                    row === queens.length - 1
                      ? "border-viz-current bg-viz-current/20 text-foreground"
                      : "border-border bg-viz-visited/10 text-muted-foreground",
                  )}
                >
                  row {row} → col {col}
                </li>
              ))}
            </ol>
          )}

          <h2 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Columns tried
          </h2>
          <div className="flex flex-col gap-1">
            {Array.from({ length: n }, (_, row) => {
              const tried = triedByRow.get(row) ?? [];
              if (tried.length === 0) return null;
              return (
                <div key={row} className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="w-8 shrink-0 text-muted-foreground">r{row}</span>
                  <span className="flex flex-wrap gap-1">
                    {tried.map((t, i) => (
                      <span
                        key={i}
                        className={cn(
                          "rounded px-1",
                          t.ok ? "bg-viz-found/20 text-viz-found" : "bg-viz-swap/20 text-viz-swap",
                        )}
                      >
                        {t.col}
                      </span>
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        </Surface>
      </div>

      <Surface variant="card" radius="2xl" className="p-4 sm:p-6">
        <VisualizerControls
          status={player.status}
          onPlay={player.play}
          onPause={player.pause}
          onReset={player.reset}
          onStepForward={player.stepForward}
          onStepBack={player.stepBack}
          delayMs={player.delayMs}
          onDelayChange={player.setDelayMs}
          stepIndex={player.index}
          stepCount={player.stepCount}
        />
        <p className="mt-4 min-h-[3rem] text-sm text-foreground" aria-live="polite">
          {step?.explanation ?? `Press Start to search a ${n} × ${n} board.`}
        </p>
      </Surface>
    </div>
  );
};

export default NQueensVisualizer;
