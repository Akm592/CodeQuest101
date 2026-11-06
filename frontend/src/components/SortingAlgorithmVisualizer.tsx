import React, { useMemo, useState } from "react";
import { Shuffle } from "lucide-react";

import { useAlgorithmPlayer } from "../hooks/useAlgorithmPlayer";
import { ALGO_INFO, buildSortSteps, parseSortArray, randomArray, type Algo, type Mark } from "../lib/algorithms/sortSteps";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import VisualizerControls from "./Visualizer/VisualizerControls";
import VisualizerLayout from "./Visualizer/VisualizerLayout";

// Four sorting algorithms, recorded as steps and played back by the shared
// player.
//
// The old page ran each sort as an async function polling a pause ref inside
// `sleep`. It could not step, read the speed once at the start, and "Stop"
// threw the array away and generated a new one.

const MARK_CLASS: Record<Mark, string> = {
  compare: "bg-viz-compare",
  swap: "bg-viz-swap",
  pivot: "bg-viz-visited",
  min: "bg-viz-pointer",
};

const LEGEND: { cls: string; label: string; algos?: Algo[] }[] = [
  { cls: "bg-viz-compare", label: "Comparing" },
  { cls: "bg-viz-swap", label: "Moving" },
  { cls: "bg-viz-pointer", label: "Smallest so far", algos: ["selection"] },
  { cls: "bg-viz-visited", label: "Pivot", algos: ["quick"] },
  { cls: "bg-viz-found", label: "Sorted" },
];

interface SortingAlgorithmVisualizerProps {
  onBack: () => void;
}

const SortingAlgorithmVisualizer: React.FC<SortingAlgorithmVisualizerProps> = ({ onBack }) => {
  const [array, setArray] = useState<number[]>(() => randomArray());
  const [algo, setAlgo] = useState<Algo>("bubble");
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const steps = useMemo(() => buildSortSteps(array, algo), [array, algo]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 150 });
  const step = player.current;
  const locked = player.status === "running";
  const shown = step?.arr ?? array;
  const sortedSet = useMemo(() => new Set(step?.sorted ?? []), [step]);
  const maxValue = Math.max(...array, 1);
  const showValues = shown.length <= 24;

  const applyCustom = () => {
    const parsed = parseSortArray(customInput);
    if (typeof parsed === "string") {
      setCustomError(parsed);
      return;
    }
    setCustomError(null);
    setArray(parsed);
  };

  const info = ALGO_INFO[algo];

  const controls = (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
        <div className="space-y-1">
          <span className="block text-sm font-medium text-muted-foreground">Algorithm</span>
          <Select value={algo} onValueChange={(v: Algo) => setAlgo(v)} disabled={locked}>
            <SelectTrigger aria-label="Algorithm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bubble">Bubble Sort</SelectItem>
              <SelectItem value="selection">Selection Sort</SelectItem>
              <SelectItem value="quick">Quick Sort</SelectItem>
              <SelectItem value="merge">Merge Sort</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label htmlFor="sort-array" className="text-sm font-medium text-muted-foreground">
            Your own array
          </label>
          <div className="flex gap-2">
            <Input
              id="sort-array"
              value={customInput}
              onChange={(e) => {
                setCustomInput(e.target.value);
                setCustomError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && applyCustom()}
              placeholder="e.g. 5, 2, 8, 1, 9"
              disabled={locked}
              className="font-mono"
            />
            <Button variant="outline" onClick={applyCustom} disabled={locked || !customInput.trim()}>
              Apply
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setArray(randomArray())}
              disabled={locked}
              aria-label="New random array"
              title="New random array"
            >
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
        minDelayMs={20}
        maxDelayMs={1000}
        stepMs={10}
        stepIndex={player.index}
        stepCount={player.stepCount}
      />
    </div>
  );

  return (
    <VisualizerLayout
      title={info.title}
      description={info.description}
      controls={controls}
      onBack={onBack}
      pseudocode={info.pseudocode}
      complexity={info.complexity}
    >
      <div className="flex w-full max-w-5xl flex-col gap-4">
        {/* A fixed height, not h-full: on a phone the controls take most of
            the screen and a percentage height left the bars a few pixels tall. */}
        <div className="flex h-56 w-full items-end gap-px rounded-xl border border-border bg-black/20 p-3 sm:h-80 sm:gap-1 sm:p-5">
          {shown.map((value, i) => {
            const mark = step?.marks[i];
            const color = mark ? MARK_CLASS[mark] : sortedSet.has(i) ? "bg-viz-found" : "bg-viz-idle/60";
            return (
              <div key={i} className="flex h-full min-w-0 flex-1 items-end pt-4">
                <div
                  className={`relative w-full rounded-t-sm transition-[height,background-color] duration-150 ${color}`}
                  style={{ height: `${Math.max((value / maxValue) * 100, 2)}%` }}
                >
                  {showValues && (
                    <span className="absolute -top-4 left-1/2 hidden -translate-x-1/2 font-mono text-[10px] text-foreground sm:block">
                      {value}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {LEGEND.filter((l) => !l.algos || l.algos.includes(algo)).map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${l.cls}`} /> {l.label}
            </span>
          ))}
        </div>

        <p className="min-h-[1.5rem] text-center text-sm text-foreground" aria-live="polite">
          {step ? step.log : `Press Start to run ${info.title.toLowerCase()} on ${array.length} values.`}
        </p>
      </div>
    </VisualizerLayout>
  );
};

export default SortingAlgorithmVisualizer;
