// One colour per confusion-matrix cell, used by the figures and the page alike.
// Correct answers are calm (green catch, grey "left alone"); the two kinds of
// mistake are the loud colours, so they are what the eye finds first.

import type { Outcome } from "../../../lib/ml/metrics";
import { C } from "../colors";

export const OUTCOME_COLOR: Record<Outcome, string> = {
  tp: C.green,
  tn: C.idle,
  fp: C.amber,
  fn: C.red,
};

/** Text-safe versions (viz-swap red is for fills; this one is readable as text). */
export const OUTCOME_TEXT: Record<Outcome, string> = {
  tp: C.green,
  tn: C.muted,
  fp: C.amber,
  fn: C.redText,
};

export const OUTCOME_SHORT: Record<Outcome, string> = { tp: "TP", fp: "FP", fn: "FN", tn: "TN" };
