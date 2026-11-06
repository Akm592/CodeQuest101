import { useCallback, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

import { useAlgorithmPlayer } from "../hooks/useAlgorithmPlayer";
import { buildRotateSteps, DEFAULT_MATRIX, parseMatrix, type Matrix, type RotationStep } from "../lib/algorithms/rotateImageSteps";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import VisualizerControls from "./Visualizer/VisualizerControls";

// Rotate an n×n matrix 90° clockwise in place: transpose, then reverse each row.
//
// The old page highlighted pairs of cells but never moved a value, so the left
// grid stayed as typed and the right grid showed the finished answer from the
// first frame. Each step now carries the matrix as it is after that swap.

const PHASE_TEXT: Record<RotationStep["phase"], string> = {
  transpose: "Step 1 of 2: transpose (swap across the diagonal)",
  reverse: "Step 2 of 2: reverse each row",
};

const RotateImageVisualizer = () => {
  const [matrix, setMatrix] = useState<Matrix>(DEFAULT_MATRIX);
  const [draft, setDraft] = useState(JSON.stringify(DEFAULT_MATRIX));
  const [error, setError] = useState<string | null>(null);

  const steps = useMemo(() => buildRotateSteps(matrix), [matrix]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 700 });
  const current = player.current;
  const grid = current?.grid ?? matrix;
  const done = player.status === "finished" || (steps.length > 0 && player.index === steps.length - 1);

  const apply = useCallback(() => {
    const parsed = parseMatrix(draft);
    if (typeof parsed === "string") {
      setError(parsed);
      return;
    }
    setError(null);
    setMatrix(parsed); // new steps identity: the player rewinds itself
  }, [draft]);

  const cellClass = (i: number, j: number) => {
    const active =
      current && ((current.a[0] === i && current.a[1] === j) || (current.b[0] === i && current.b[1] === j));
    if (active) return "border-viz-swap bg-viz-swap/20 text-foreground scale-105";
    if (done) return "border-viz-found/50 bg-viz-found/15 text-foreground";
    return "border-border bg-muted text-foreground";
  };

  const renderGrid = (m: Matrix, highlight: boolean, label: string) => (
    <figure className="flex flex-col items-center gap-2">
      <figcaption className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</figcaption>
      <div className="grid gap-1 sm:gap-1.5" style={{ gridTemplateColumns: `repeat(${m.length}, minmax(0, 1fr))` }}>
        {m.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className={`flex h-10 w-10 items-center justify-center rounded-md border-2 font-mono text-sm font-medium transition-all duration-300 sm:h-12 sm:w-12 md:h-14 md:w-14 ${
                highlight ? cellClass(i, j) : "border-border bg-muted/50 text-muted-foreground"
              }`}
            >
              {cell}
            </div>
          )),
        )}
      </div>
    </figure>
  );

  let status = "Press Start to rotate the matrix 90° clockwise.";
  if (current) {
    const [ai, aj] = current.a;
    const [bi, bj] = current.b;
    status = `Swap (${ai},${aj}) ↔ (${bi},${bj})`;
  }
  if (done) status = "Done: the matrix is rotated 90° clockwise.";
  if (steps.length === 0) status = "A 1×1 matrix is already rotated.";

  return (
    <Card className="mx-auto w-full max-w-3xl overflow-hidden">
      <CardContent className="space-y-5 p-4 sm:p-6">
        <div className="space-y-2">
          <label htmlFor="rotate-matrix" className="block text-sm font-medium text-muted-foreground">
            Square matrix
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="rotate-matrix"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder="[[1,2,3],[4,5,6],[7,8,9]]"
              className="font-mono text-sm"
              aria-invalid={Boolean(error)}
            />
            <Button variant="outline" onClick={apply} disabled={!draft.trim()} className="sm:w-auto">
              Apply
            </Button>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-border pt-4">
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
            disabledReason={steps.length === 0 ? "Nothing to rotate in a 1×1 matrix." : null}
          />
        </div>

        <div className="flex flex-col items-center justify-center gap-4 overflow-x-auto py-2 sm:flex-row sm:gap-6">
          {renderGrid(matrix, false, "Original")}
          <ArrowRight className="h-6 w-6 shrink-0 rotate-90 text-muted-foreground sm:rotate-0" aria-hidden="true" />
          {renderGrid(grid, true, done ? "Rotated" : "Working")}
        </div>

        <div className="space-y-1 border-t border-border pt-4 text-center" aria-live="polite">
          {current && !done && <p className="text-xs font-medium text-primary">{PHASE_TEXT[current.phase]}</p>}
          <p className="text-sm text-foreground">{status}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RotateImageVisualizer;
