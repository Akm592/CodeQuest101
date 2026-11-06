import { useMemo, useState } from "react";
import { CheckCircle, Target, XCircle } from "lucide-react";

import { useAlgorithmPlayer } from "../hooks/useAlgorithmPlayer";
import { buildSubarraySteps, parseNonNegativeArray, type WindowStep } from "../lib/algorithms/subarraySumSteps";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import VisualizerControls from "./Visualizer/VisualizerControls";

// Longest subarray with sum K, sliding window.
//
// The steps are computed up front, so the page can pause, step both ways and
// change speed mid-run. The old page ran the algorithm one timer tick at a
// time and could only go forwards.
//
// The window only works for non-negative numbers: with a negative value,
// shrinking from the left can make the sum grow again. Negative input is
// refused with that explanation rather than giving a wrong answer.

const NO_STEPS: WindowStep[] = [];

const LongestSubarraySumKVisualizer = () => {
  const [arrInput, setArrInput] = useState("10, 5, 2, 7, 1, 9");
  const [kInput, setKInput] = useState("15");

  const parsedArr = useMemo(() => parseNonNegativeArray(arrInput), [arrInput]);
  const k = kInput.trim() === "" ? NaN : Number(kInput);

  let inputError: string | null = null;
  if (typeof parsedArr === "string") inputError = parsedArr;
  else if (!Number.isFinite(k)) inputError = "Target K must be a number.";

  const arr = useMemo(() => (typeof parsedArr === "string" ? [] : parsedArr), [parsedArr]);
  const steps = useMemo(() => (inputError ? NO_STEPS : buildSubarraySteps(arr, k)), [arr, k, inputError]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 800 });
  const step = player.current;
  const finished = step?.action === "done";
  const locked = player.status === "running";

  const cellClass = (i: number) => {
    const base =
      "relative flex h-10 w-10 items-center justify-center rounded-md border-2 font-mono text-sm font-medium transition-all duration-200 sm:h-12 sm:w-12";
    if (!step) return `${base} border-border bg-muted text-foreground`;
    if (finished) {
      return step.best && i >= step.best.start && i <= step.best.end
        ? `${base} border-viz-found bg-viz-found/20 text-foreground`
        : `${base} border-border bg-muted/50 text-muted-foreground`;
    }
    const inWindow = i >= step.left && i <= step.right;
    if (!inWindow) return `${base} border-border bg-muted/50 text-muted-foreground`;
    if (step.action === "match") return `${base} border-viz-found bg-viz-found/20 text-foreground`;
    if (step.action === "add" && i === step.right) return `${base} border-viz-current bg-viz-current/20 text-foreground`;
    return `${base} border-primary/60 bg-primary/10 text-foreground`;
  };

  const best = step?.best ?? null;
  const bestLength = best ? best.end - best.start + 1 : 0;

  return (
    <Card className="mx-auto w-full max-w-4xl overflow-hidden">
      <CardContent className="space-y-5 p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
          <div className="space-y-1">
            <label htmlFor="arrayInput" className="text-sm font-medium text-muted-foreground">
              Array (non-negative, comma or space separated)
            </label>
            <Input
              id="arrayInput"
              value={arrInput}
              onChange={(e) => setArrInput(e.target.value)}
              placeholder="10, 5, 2, 7, 1, 9"
              disabled={locked}
              className="font-mono text-sm"
              aria-invalid={typeof parsedArr === "string"}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="kInput" className="text-sm font-medium text-muted-foreground">
              Target sum K
            </label>
            <div className="relative">
              <Target className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="kInput"
                type="number"
                value={kInput}
                onChange={(e) => setKInput(e.target.value)}
                disabled={locked}
                className="pl-9 font-mono text-sm"
              />
            </div>
          </div>
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
            disabledReason={inputError}
          />
        </div>

        <div className="flex min-h-[4.5rem] flex-wrap justify-center gap-1.5 rounded-lg border border-border bg-black/20 p-3">
          {arr.length > 0 ? (
            arr.map((num, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={cellClass(i)}>{num}</div>
                <span className="h-4 font-mono text-[10px] text-muted-foreground">
                  {step && !finished && i === step.left && "L"}
                  {step && !finished && i === step.left && i === step.right && " "}
                  {step && !finished && i === step.right && "R"}
                  {(!step || finished) && i}
                </span>
              </div>
            ))
          ) : (
            <p className="self-center text-sm text-muted-foreground">Enter an array above.</p>
          )}
        </div>

        <dl className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg border border-border bg-muted/40 p-2">
            <dt className="text-xs text-muted-foreground">Window sum</dt>
            <dd className="font-mono font-semibold text-foreground">{step ? step.sum : 0}</dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-2">
            <dt className="text-xs text-muted-foreground">Target K</dt>
            <dd className="font-mono font-semibold text-foreground">{Number.isFinite(k) ? k : "–"}</dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-2">
            <dt className="text-xs text-muted-foreground">Best length</dt>
            <dd className="font-mono font-semibold text-foreground">{bestLength}</dd>
          </div>
        </dl>

        <div className="border-t border-border pt-3 text-center" aria-live="polite">
          {finished ? (
            <p className={`flex items-center justify-center gap-2 font-medium ${best ? "text-viz-found" : "text-destructive"}`}>
              {best ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {best
                ? `Longest: [${arr.slice(best.start, best.end + 1).join(", ")}], length ${bestLength}`
                : `No subarray adds up to ${k}.`}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{step ? step.log : "Press Start to slide the window."}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LongestSubarraySumKVisualizer;
