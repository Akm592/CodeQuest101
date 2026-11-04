// Playback for a precomputed array of algorithm steps.
//
// The repo already contained both halves of this. GraphTraversalVisualizer
// generates an `AlgorithmStep[]` up front and plays it back by index, which is
// why it is the only visualizer in the app where step-backward works.
// LongestSubarraySumKVisualizer drives stepping from a `useEffect` timer, which
// is why pausing it costs one `setStatus` rather than an AbortController and a
// ref polled inside `sleep`. This is the two of them put together.
//
// What it replaces, by contrast: BinarySearchVisualizer runs the real algorithm
// in an async `while` loop with `await sleep()` between `setState` calls. That
// loop cannot be paused, cannot be stepped, and calls `setState` after unmount.
//
// CONTRACT: the caller must memoize `steps`. A fresh array identity resets
// playback to the start (which is what you want when the inputs change), so an
// unmemoized array resets on every render and playback never advances. Build
// steps in a `useMemo` keyed on the inputs; `react-hooks/exhaustive-deps` is
// enabled in this repo and will catch a missing dependency.

import * as React from "react";

export type PlayerStatus = "idle" | "running" | "paused" | "finished";

export const MIN_DELAY_MS = 100;
export const MAX_DELAY_MS = 1500;
export const DEFAULT_DELAY_MS = 600;

/** Index meaning "before the first step", so a visualizer can draw its initial frame. */
export const BEFORE_START = -1;

export interface AlgorithmPlayerOptions {
  initialDelayMs?: number;
  autoPlay?: boolean;
  onFinish?: () => void;
}

export interface AlgorithmPlayer<TStep> {
  /** BEFORE_START (-1) until the first step is shown. */
  index: number;
  current: TStep | null;
  status: PlayerStatus;
  stepCount: number;
  delayMs: number;
  setDelayMs: (ms: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stepForward: () => void;
  stepBack: () => void;
  reset: () => void;
  /** Jump straight to a step — lets a viewer click a table cell to go there. */
  seek: (i: number) => void;
}

/**
 * Where playback goes next. Extracted as a pure function so the one piece of
 * real logic here is testable without jsdom or fake timers.
 *
 * Returns the next index, or null when there is nowhere to advance to.
 */
export function nextIndex(index: number, stepCount: number): number | null {
  if (stepCount === 0) return null;
  if (index >= stepCount - 1) return null;
  return index + 1;
}

export function useAlgorithmPlayer<TStep>(
  steps: readonly TStep[],
  options: AlgorithmPlayerOptions = {},
): AlgorithmPlayer<TStep> {
  const { initialDelayMs = DEFAULT_DELAY_MS, autoPlay = false, onFinish } = options;

  const [index, setIndex] = React.useState(BEFORE_START);
  const [status, setStatus] = React.useState<PlayerStatus>(autoPlay ? "running" : "idle");
  const [delayMs, setDelayMs] = React.useState(initialDelayMs);

  const stepCount = steps.length;

  // `onFinish` is read from a ref so a caller passing an inline arrow does not
  // restart the timer on every render.
  const onFinishRef = React.useRef(onFinish);
  React.useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  // A new `steps` identity means the inputs changed, so rewind. Clamping the old
  // index into a different algorithm's step list would render a frame that never
  // occurred. LongestSubarraySumKVisualizer:44-46 does this by hand today.
  React.useEffect(() => {
    setIndex(BEFORE_START);
    setStatus(autoPlay ? "running" : "idle");
    // autoPlay is read deliberately: it is a fixed option, not a live input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps]);

  React.useEffect(() => {
    if (status !== "running") return;

    const target = nextIndex(index, stepCount);
    if (target === null) {
      setStatus("finished");
      onFinishRef.current?.();
      return;
    }

    // Advancing out of BEFORE_START happens immediately: waiting a full delay
    // before the first step is just dead air on the screen.
    const wait = index === BEFORE_START ? 0 : delayMs;
    const timer = setTimeout(() => setIndex(target), wait);
    return () => clearTimeout(timer);
  }, [status, index, stepCount, delayMs]);

  const play = React.useCallback(() => {
    // Replaying from the end rewinds first, so the primary button can read
    // "Replay" without the caller having to special-case it.
    setIndex((i) => (i >= stepCount - 1 ? BEFORE_START : i));
    setStatus("running");
  }, [stepCount]);

  const pause = React.useCallback(() => {
    setStatus((s) => (s === "running" ? "paused" : s));
  }, []);

  const toggle = React.useCallback(() => {
    if (status === "running") pause();
    else play();
  }, [status, pause, play]);

  const stepForward = React.useCallback(() => {
    setStatus("paused");
    setIndex((i) => {
      const target = nextIndex(i, stepCount);
      return target === null ? i : target;
    });
  }, [stepCount]);

  const stepBack = React.useCallback(() => {
    setStatus("paused");
    setIndex((i) => (i <= BEFORE_START ? i : i - 1));
  }, []);

  const reset = React.useCallback(() => {
    setIndex(BEFORE_START);
    setStatus("idle");
  }, []);

  const seek = React.useCallback(
    (i: number) => {
      setStatus("paused");
      setIndex(Math.max(BEFORE_START, Math.min(i, stepCount - 1)));
    },
    [stepCount],
  );

  return {
    index,
    current: index >= 0 && index < stepCount ? steps[index] : null,
    status,
    stepCount,
    delayMs,
    setDelayMs,
    play,
    pause,
    toggle,
    stepForward,
    stepBack,
    reset,
    seek,
  };
}
