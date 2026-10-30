// Drives a card preview: steps forward on a timer, holds on the last frame,
// then starts over.
//
// Unlike useAlgorithmPlayer there are no controls, so the hook owns the whole
// lifecycle. It only runs while the card is on screen and the tab is visible,
// so a page of previews costs nothing once scrolled past. Under reduced motion
// it never starts and shows the last frame, the one with the most to see.

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export const PREVIEW_DELAY_MS = 700;
export const PREVIEW_HOLD_MS = 1800;

/** The index after `index`, wrapping to the start. */
export function loopNext(index: number, stepCount: number): number {
  if (stepCount <= 0) return 0;
  return index + 1 < stepCount ? index + 1 : 0;
}

/** How long to show frame `index` before moving on: the last frame is held. */
export function frameDuration(
  index: number,
  stepCount: number,
  delayMs: number,
  holdMs: number,
): number {
  return index >= stepCount - 1 ? holdMs : delayMs;
}

/** One full pass, including the hold on the final frame. */
export function loopDuration(stepCount: number, delayMs: number, holdMs: number): number {
  if (stepCount <= 0) return 0;
  return (stepCount - 1) * delayMs + holdMs;
}

export interface PreviewLoopOptions {
  delayMs?: number;
  holdMs?: number;
}

export function usePreviewLoop<T extends Element>(
  stepCount: number,
  { delayMs = PREVIEW_DELAY_MS, holdMs = PREVIEW_HOLD_MS }: PreviewLoopOptions = {},
) {
  const ref = useRef<T>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const [onScreen, setOnScreen] = useState(false);
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === "undefined" || !document.hidden,
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setOnScreen(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onChange = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  const playing = !reducedMotion && onScreen && pageVisible && stepCount > 1;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(
      () => setIndex((i) => loopNext(i, stepCount)),
      frameDuration(index, stepCount, delayMs, holdMs),
    );
    return () => window.clearTimeout(timer);
  }, [playing, index, stepCount, delayMs, holdMs]);

  const shown = reducedMotion ? Math.max(0, stepCount - 1) : Math.min(index, Math.max(0, stepCount - 1));
  return { ref, index: shown, playing };
}
