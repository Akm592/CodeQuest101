import React, { useMemo, useState } from "react";
import { CheckCircle, Shuffle, Target, XCircle } from "lucide-react";

import { useAlgorithmPlayer } from "../hooks/useAlgorithmPlayer";
import { buildBinarySearchSteps, parseSortedArray, randomSortedArray, type SearchStep } from "../lib/algorithms/binarySearchSteps";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import VisualizerControls from "./Visualizer/VisualizerControls";
import VisualizerLayout from "./Visualizer/VisualizerLayout";

// Binary search over a sorted array.
//
// The old page ran the search in an async loop with `await sleep()`, so it
// could not pause or step, read the speed once at the start, and kept calling
// setState after you left the page. The steps are now computed up front and
// played back by the shared player.

const DESCRIPTION = (
  <div className="space-y-4">
    <p>
      Binary search finds a value in a <strong>sorted</strong> array by halving the range that could still contain it,
      until the value is found or the range is empty.
    </p>
    <ul className="list-disc space-y-1 pl-4">
      <li>
        Start with <strong>L</strong> = 0 and <strong>R</strong> = length − 1.
      </li>
      <li>
        Look at the middle, <strong>M</strong> = ⌊(L + R) / 2⌋.
      </li>
      <li>If it equals the target, you're done.</li>
      <li>If it's smaller, the target can only be to the right: L = M + 1.</li>
      <li>If it's larger, the target can only be to the left: R = M − 1.</li>
    </ul>
  </div>
);

const PSEUDOCODE = `function binarySearch(arr, target):
    left = 0
    right = arr.length - 1

    while left <= right:
        mid = floor((left + right) / 2)

        if arr[mid] == target:
            return mid          // found

        if arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1                   // not found`;

const NO_STEPS: SearchStep[] = [];

interface BinarySearchVisualizerProps {
  onBack: () => void;
}

const BinarySearchVisualizer: React.FC<BinarySearchVisualizerProps> = ({ onBack }) => {
  const [array, setArray] = useState<number[]>(randomSortedArray);
  // Default to a value that is in the array, so Start does something at once.
  const [targetInput, setTargetInput] = useState(() => String(array[Math.floor(array.length * 0.7)]));
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const target = targetInput.trim() === "" ? NaN : Number(targetInput);
  const targetError = Number.isFinite(target) ? null : "Enter a number to search for.";

  const steps = useMemo(() => (targetError ? NO_STEPS : buildBinarySearchSteps(array, target)), [array, target, targetError]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 800 });
  const step = player.current;
  const locked = player.status === "running";

  const newRandom = () => {
    const next = randomSortedArray();
    setArray(next);
    setTargetInput(String(next[Math.floor(Math.random() * next.length)]));
    setCustomError(null);
  };

  const applyCustom = () => {
    const parsed = parseSortedArray(customInput);
    if (typeof parsed === "string") {
      setCustomError(parsed);
      return;
    }
    setArray(parsed);
    setCustomError(null);
  };

  const cellClass = (i: number) => {
    const base =
      "flex h-11 w-11 items-center justify-center rounded-md border-2 font-mono text-sm font-medium transition-all duration-300 sm:h-12 sm:w-12";
    if (!step) return `${base} border-border bg-muted text-foreground`;
    if (step.outcome === "found" && i === step.mid) return `${base} scale-110 border-viz-found bg-viz-found/25 text-foreground`;
    if (i === step.mid) return `${base} scale-105 border-viz-current bg-viz-current/20 text-foreground`;
    if (i >= step.left && i <= step.right) return `${base} border-primary/40 bg-primary/10 text-foreground`;
    return `${base} border-border/60 bg-muted/30 text-muted-foreground/50`;
  };

  const pointers = (i: number) => {
    if (!step || step.outcome === "not-found") return null;
    const labels: { text: string; cls: string }[] = [];
    if (i === step.left) labels.push({ text: "L", cls: "text-viz-pointer" });
    if (i === step.mid) labels.push({ text: "M", cls: "text-viz-current" });
    if (i === step.right) labels.push({ text: "R", cls: "text-viz-compare" });
    return labels.map((l) => (
      <span key={l.text} className={l.cls}>
        {l.text}
      </span>
    ));
  };

  const controls = (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <div className="space-y-1">
          <label htmlFor="bs-target" className="text-sm font-medium text-muted-foreground">
            Target
          </label>
          <div className="relative">
            <Target className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="bs-target"
              type="number"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              disabled={locked}
              className="pl-9 font-mono"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="bs-array" className="text-sm font-medium text-muted-foreground">
            Your own array (sorted for you)
          </label>
          <div className="flex gap-2">
            <Input
              id="bs-array"
              value={customInput}
              onChange={(e) => {
                setCustomInput(e.target.value);
                setCustomError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && applyCustom()}
              placeholder="e.g. 3, 8, 15, 23, 42"
              disabled={locked}
              className="font-mono"
            />
            <Button variant="outline" onClick={applyCustom} disabled={locked || !customInput.trim()}>
              Apply
            </Button>
            <Button variant="outline" size="icon" onClick={newRandom} disabled={locked} aria-label="New random array" title="New random array">
              <Shuffle />
            </Button>
          </div>
          {customError && (
            <p className="text-sm text-destructive" role="alert">
              {customError}
            </p>
          )}
        </div>
      </div>

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
        disabledReason={targetError}
      />
    </div>
  );

  return (
    <VisualizerLayout
      title="Binary Search"
      description={DESCRIPTION}
      controls={controls}
      onBack={onBack}
      pseudocode={PSEUDOCODE}
      complexity={{ time: "O(log n)", space: "O(1)" }}
    >
      <div className="flex w-full max-w-4xl flex-col items-center gap-6">
        <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-3">
          {array.map((value, i) => (
            <div key={`${i}-${value}`} className="flex flex-col items-center gap-1">
              <div className={cellClass(i)}>{value}</div>
              <span className="font-mono text-[10px] text-muted-foreground">{i}</span>
              <span className="flex h-4 gap-0.5 font-mono text-xs font-bold">{pointers(i)}</span>
            </div>
          ))}
        </div>

        <div className="min-h-[2.5rem] text-center" aria-live="polite">
          {step?.outcome === "found" && (
            <p className="flex items-center justify-center gap-2 font-medium text-viz-found">
              <CheckCircle className="h-4 w-4" /> Found {target} at index {step.mid}
            </p>
          )}
          {step?.outcome === "not-found" && (
            <p className="flex items-center justify-center gap-2 font-medium text-destructive">
              <XCircle className="h-4 w-4" /> {target} is not in the array
            </p>
          )}
          <p className="text-sm text-muted-foreground">{step ? step.log : `Press Start to search for ${Number.isFinite(target) ? target : "a value"}.`}</p>
        </div>
      </div>
    </VisualizerLayout>
  );
};

export default BinarySearchVisualizer;
