// Dynamic programming, as a table that fills and then gets read back.
//
// The point of the page is the arrows. A DP recurrence is hard to read because
// "dp[i][j] = min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]) + 1" hides which cell
// actually won; here the cells it consulted are tinted and the one it took has
// a line drawn to it. Then the traceback walks back from the answer and spells
// out the real result — the edit script, the subsequence, the items taken —
// rather than leaving a number in the corner.
//
// The grid is DOM, not SVG, so the numerals are selectable, focusable and
// measurable by the contrast checker. Only the arrows are SVG, in an overlay.

import * as React from "react";

import {
  buildEditDistanceSteps,
  buildKnapsackSteps,
  buildLcsSteps,
  type DpResult,
  type DpStep,
  type KnapsackItem,
} from "../lib/algorithms/dpSteps";
import { useAlgorithmPlayer } from "../hooks/useAlgorithmPlayer";
import { cn } from "../lib/utils";
import { Input } from "./ui/input";
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

type ProblemKey = "editDistance" | "lcs" | "knapsack";

const KNAPSACK_ITEMS: KnapsackItem[] = [
  { weight: 5, value: 10, label: "A" },
  { weight: 4, value: 40, label: "B" },
  { weight: 6, value: 30, label: "C" },
  { weight: 3, value: 50, label: "D" },
];

interface ProblemInfo {
  title: string;
  recurrence: string;
  description: string;
  complexity: { time: string; space: string };
}

// Same shape as SortingAlgorithmVisualizer's ALGO_INFO: one record, looked up
// by the current selection, so adding a problem is a data change.
const DP_PROBLEMS: Record<ProblemKey, ProblemInfo> = {
  editDistance: {
    title: "Edit Distance",
    recurrence: "dp[i][j] = match ? dp[i-1][j-1] : 1 + min(replace, delete, insert)",
    description:
      "The fewest single-character edits that turn one string into the other. Each cell reads exactly three neighbours, and the arrow drawn to the winner is the edit operation itself.",
    complexity: { time: "O(m × n)", space: "O(m × n)" },
  },
  lcs: {
    title: "Longest Common Subsequence",
    recurrence: "dp[i][j] = match ? dp[i-1][j-1] + 1 : max(dp[i-1][j], dp[i][j-1])",
    description:
      "The longest sequence of characters appearing in both strings in order, though not necessarily adjacent. Same table shape as edit distance with a different recurrence — which is the point.",
    complexity: { time: "O(m × n)", space: "O(m × n)" },
  },
  knapsack: {
    title: "0/1 Knapsack",
    recurrence: "dp[i][c] = max(dp[i-1][c], dp[i-1][c - weight] + value)",
    description:
      "The most valuable set of items that fits a capacity, each item taken once or not at all. Rows are items and columns are capacity, and the back-reference jumps a variable distance left — the part people trip on.",
    complexity: { time: "O(n × capacity)", space: "O(n × capacity)" },
  },
};

const CELL = 44;
const GAP = 4;
const PITCH = CELL + GAP;

/** Centre of a table cell in overlay coordinates, allowing for the header row/column. */
const centre = (row: number, col: number) => ({
  x: (col + 1) * PITCH + CELL / 2,
  y: (row + 1) * PITCH + CELL / 2,
});

const DynamicProgrammingVisualizer: React.FC = () => {
  const [problem, setProblem] = React.useState<ProblemKey>("editDistance");
  const [source, setSource] = React.useState("kitten");
  const [target, setTarget] = React.useState("sitting");
  const [capacity, setCapacity] = React.useState(10);

  // Built during render, not in an effect: the UI consistency checker samples
  // roughly 1.4s after load, so anything gated behind a timer gets measured
  // mid-mount. Eager generation also means the step count is known up front.
  const result: DpResult = React.useMemo(() => {
    switch (problem) {
      case "lcs":
        return buildLcsSteps(source.slice(0, 12), target.slice(0, 12));
      case "knapsack":
        return buildKnapsackSteps(KNAPSACK_ITEMS, capacity);
      default:
        return buildEditDistanceSteps(source.slice(0, 12), target.slice(0, 12));
    }
  }, [problem, source, target, capacity]);

  const player = useAlgorithmPlayer(result.steps);
  const step: DpStep | null = player.current;
  const info = DP_PROBLEMS[problem];

  const grid = step?.grid ?? result.steps[0]?.grid ?? [[0]];
  const { rowHeader, colHeader } = result.labels;

  const fromSet = new Set((step?.from ?? []).map((c) => `${c.row},${c.col}`));
  const pathSet = new Set((step?.path ?? []).map((c) => `${c.row},${c.col}`));
  const isTraceback = step?.phase === "traceback" || step?.phase === "done";

  const overlayW = (colHeader.length + 1) * PITCH;
  const overlayH = (rowHeader.length + 1) * PITCH;

  const cellClass = (row: number, col: number): string => {
    const key = `${row},${col}`;
    const current = step && step.row === row && step.col === col && step.phase === "fill";

    if (current) return "bg-viz-current/30 ring-2 ring-viz-current text-foreground font-bold";
    if (isTraceback && pathSet.has(key)) return "bg-viz-found/25 ring-1 ring-viz-found text-foreground font-semibold";
    if (fromSet.has(key)) return "bg-viz-compare/20 ring-1 ring-viz-compare text-foreground";

    // A cell is "settled" once the sweep has passed it.
    const settled =
      step != null &&
      (step.phase !== "fill" || row < step.row || (row === step.row && col < step.col));
    if (settled) return "bg-viz-visited/15 text-foreground";
    return "bg-viz-idle/10 text-muted-foreground";
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <Surface variant="card" radius="2xl" className="p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="dp-problem" className="mb-1 text-xs text-muted-foreground">Problem</Label>
            <Select value={problem} onValueChange={(v) => setProblem(v as ProblemKey)}>
              <SelectTrigger id="dp-problem"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="editDistance">Edit Distance</SelectItem>
                <SelectItem value="lcs">Longest Common Subsequence</SelectItem>
                <SelectItem value="knapsack">0/1 Knapsack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {problem === "knapsack" ? (
            <div>
              <Label htmlFor="dp-capacity" className="mb-1 text-xs text-muted-foreground">Capacity</Label>
              <Input
                id="dp-capacity"
                type="number"
                min={1}
                max={16}
                value={capacity}
                onChange={(e) => setCapacity(Math.max(1, Math.min(16, Number(e.target.value) || 1)))}
                className="font-mono"
              />
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="dp-source" className="mb-1 text-xs text-muted-foreground">First string</Label>
                <Input
                  id="dp-source"
                  value={source}
                  maxLength={12}
                  onChange={(e) => setSource(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="dp-target" className="mb-1 text-xs text-muted-foreground">Second string</Label>
                <Input
                  id="dp-target"
                  value={target}
                  maxLength={12}
                  onChange={(e) => setTarget(e.target.value)}
                  className="font-mono"
                />
              </div>
            </>
          )}
        </div>

        <p className="mt-4 text-sm text-muted-foreground">{info.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Surface variant="chip" radius="full" className="px-3 py-1 font-mono text-secondary-bright">
            {info.recurrence}
          </Surface>
          <Surface variant="chip" radius="full" className="px-3 py-1 font-mono text-muted-foreground">
            time {info.complexity.time}
          </Surface>
          <Surface variant="chip" radius="full" className="px-3 py-1 font-mono text-muted-foreground">
            space {info.complexity.space}
          </Surface>
        </div>
      </Surface>

      <Surface variant="well" radius="2xl" className="overflow-x-auto p-4 sm:p-6">
        <div className="relative mx-auto" style={{ width: overlayW, height: overlayH }}>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${colHeader.length + 1}, ${CELL}px)`,
              gap: GAP,
            }}
          >
            {/* Corner + column headers */}
            <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height: CELL }} />
            {colHeader.map((label, c) => (
              <div
                key={`col-${c}`}
                className="flex items-center justify-center font-mono text-sm font-semibold text-viz-pointer"
                style={{ height: CELL }}
              >
                {label}
              </div>
            ))}

            {grid.map((row, r) => (
              <React.Fragment key={`row-${r}`}>
                <div
                  className="flex items-center justify-center font-mono text-sm font-semibold text-viz-pointer"
                  style={{ height: CELL }}
                >
                  {rowHeader[r]}
                </div>
                {row.map((value, c) => (
                  <div
                    key={`cell-${r}-${c}`}
                    className={cn(
                      "flex items-center justify-center rounded-md font-mono text-sm transition-colors duration-200",
                      cellClass(r, c),
                    )}
                    style={{ height: CELL }}
                  >
                    {value}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* Dependency arrows. The whole reason this page exists. */}
          <svg
            className="pointer-events-none absolute inset-0"
            width={overlayW}
            height={overlayH}
            aria-hidden="true"
          >
            {step?.phase === "fill" &&
              step.from.map((src) => {
                const a = centre(src.row, src.col);
                const b = centre(step.row, step.col);
                const chosen =
                  step.chosen && step.chosen.row === src.row && step.chosen.col === src.col;
                return (
                  <line
                    key={`arrow-${src.row}-${src.col}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={chosen ? "hsl(var(--viz-current))" : "hsl(var(--viz-compare))"}
                    strokeWidth={chosen ? 3 : 1.5}
                    strokeDasharray={chosen ? undefined : "4 3"}
                    opacity={chosen ? 0.95 : 0.5}
                  />
                );
              })}

            {isTraceback &&
              (step?.path ?? []).slice(0, -1).map((cell, i) => {
                const path = step?.path ?? [];
                const a = centre(cell.row, cell.col);
                const b = centre(path[i + 1].row, path[i + 1].col);
                return (
                  <line
                    key={`path-${i}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="hsl(var(--viz-found))"
                    strokeWidth={3}
                    opacity={0.9}
                  />
                );
              })}
          </svg>
        </div>
      </Surface>

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
          disabledReason={
            problem !== "knapsack" && (source.length === 0 || target.length === 0)
              ? "Enter both strings."
              : null
          }
        />

        <p className="mt-4 min-h-[3rem] text-sm text-foreground" aria-live="polite">
          {step?.explanation ?? `Press Start to fill the ${info.title.toLowerCase()} table.`}
        </p>
      </Surface>
    </div>
  );
};

export default DynamicProgrammingVisualizer;
