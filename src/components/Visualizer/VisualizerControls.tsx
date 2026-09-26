// The one play/pause/step/reset/speed surface.
//
// Seven files used to hand-roll this, and they had already drifted apart:
//
//   BinarySearchVisualizer      50 / 1500 / 750    no slider classes, no aria-label
//   SortingAlgorithmVisualizer  10 / 1000 / 300    no slider classes, no aria-label
//   FloydsAlgorithmVisualizer  100 / 1500 / 750
//   SpiralAnimation            100 / 1500 / 500
//   LongestSubarraySumK        100 / 2000 / 1000   no aria-label
//   RotateImageVisualizer      raw ms, NO inversion — dragging right slows it down
//   Graphs/AlgorithmControls   0-100 %, with a bg-blue-500 outside the token set
//
// So the same slider position meant five different speeds, four controls had no
// accessible name, and one ran backwards. Extracting this is a correctness fix,
// not tidying up.
//
// SPEED IS ALWAYS PLAIN MILLISECONDS outside this file. The "higher means
// faster" mirror lives in the two expressions below and nowhere else. The old
// convention — store the inverted slider value, convert on every read — has
// already produced two bugs: SortingAlgorithmVisualizer:83 initialises to
// `MAX - DEFAULT` while its own converter is `MAX + MIN - v`, so its default
// speed is off by MIN from the moment it mounts, and RotateImageVisualizer
// simply forgot to invert. Neither is possible once ms is the only
// representation that escapes.

import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import * as React from "react";

import {
  MAX_DELAY_MS,
  MIN_DELAY_MS,
  type PlayerStatus,
} from "../../hooks/useAlgorithmPlayer";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";

export interface VisualizerControlsProps {
  status: PlayerStatus;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onStepBack: () => void;

  /** Milliseconds between automatic steps. The single canonical unit. */
  delayMs: number;
  onDelayChange: (ms: number) => void;
  minDelayMs?: number;
  maxDelayMs?: number;
  /** Slider granularity in ms. */
  stepMs?: number;

  /** -1 means "before the first step". Drives the readout and end-disabling. */
  stepIndex?: number;
  stepCount?: number;

  /** When set, Play is blocked and this explains why (e.g. an invalid input). */
  disabledReason?: string | null;

  /** Extra controls rendered inline — an algorithm selector, inputs. */
  children?: React.ReactNode;
  className?: string;
}

/** What the primary button says, given where playback is. */
function primaryLabel(status: PlayerStatus): string {
  switch (status) {
    case "running":
      return "Pause";
    case "paused":
      return "Resume";
    case "finished":
      return "Replay";
    default:
      return "Start";
  }
}

export const VisualizerControls: React.FC<VisualizerControlsProps> = ({
  status,
  onPlay,
  onPause,
  onReset,
  onStepForward,
  onStepBack,
  delayMs,
  onDelayChange,
  minDelayMs = MIN_DELAY_MS,
  maxDelayMs = MAX_DELAY_MS,
  stepMs = 50,
  stepIndex,
  stepCount,
  disabledReason,
  children,
  className,
}) => {
  const running = status === "running";
  const blocked = Boolean(disabledReason);

  const hasProgress = typeof stepIndex === "number" && typeof stepCount === "number";
  const atStart = hasProgress ? stepIndex <= -1 : false;
  const atEnd = hasProgress ? stepIndex >= stepCount - 1 : false;

  // Every disable rule lives here, so seven call sites cannot each get a
  // different subset of them right.
  const canStepBack = !running && !blocked && !atStart;
  const canStepForward = !running && !blocked && !atEnd;
  const canReset = !(status === "idle" && atStart);

  // The mirror. `value` is what the slider shows; `onValueChange` converts
  // straight back to milliseconds so nothing downstream sees the inverted form.
  const sliderValue = maxDelayMs + minDelayMs - delayMs;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={running ? onPause : onPlay}
          disabled={blocked}
          title={disabledReason ?? undefined}
          className="min-w-[7rem]"
        >
          {running ? <Pause /> : <Play />}
          {primaryLabel(status)}
        </Button>

        <Button variant="outline" size="icon" onClick={onStepBack} disabled={!canStepBack} aria-label="Step backward">
          <SkipBack />
        </Button>
        <Button variant="outline" size="icon" onClick={onStepForward} disabled={!canStepForward} aria-label="Step forward">
          <SkipForward />
        </Button>

        <Button variant="outline" onClick={onReset} disabled={!canReset}>
          <RotateCcw />
          Reset
        </Button>

        {hasProgress && (
          <span className="ml-auto font-mono text-xs text-muted-foreground" aria-live="polite">
            Step {Math.max(0, stepIndex + 1)} / {stepCount}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="visualizer-speed" className="shrink-0 text-sm font-medium text-muted-foreground">
          Speed
        </label>
        <Slider
          id="visualizer-speed"
          value={[sliderValue]}
          onValueChange={([v]) => onDelayChange(maxDelayMs + minDelayMs - v)}
          min={minDelayMs}
          max={maxDelayMs}
          step={stepMs}
          // Deliberately NOT disabled while running. Every page this replaces
          // locked the slider mid-run, which is the most irritating thing about
          // the current visualizers; with a timer-driven player it is free.
          className="flex-grow [&>span:first-child]:bg-muted"
          aria-label="Animation speed"
        />
        <span className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground">
          {delayMs} ms
        </span>
      </div>

      {disabledReason && (
        <p className="text-sm text-viz-swap" role="status">
          {disabledReason}
        </p>
      )}

      {children}
    </div>
  );
};

export default VisualizerControls;
