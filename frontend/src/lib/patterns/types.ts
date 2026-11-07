// Shared shapes for the Interview Patterns pages (NeetCode 150).
//
// Every problem is a pure step generator plus a brute-force solver. The tests
// run both on hundreds of random inputs and check they agree, and the page
// shows how much work each one did on the current input.

import type { BaseStep } from "../algorithms/types";
import type { AlgorithmGuide, VizTone } from "../guides/types";

export interface PCell {
  v: string;
  tone?: VizTone;
  /** Small label under the cell, e.g. "i" or "L". */
  tag?: string;
}

export interface PRow {
  label: string;
  cells: PCell[];
}

export interface PEntry {
  k: string;
  v: string;
  tone?: VizTone;
}

export interface PatternStep extends BaseStep {
  /** The guide stage this step belongs to. */
  stage: string;
  rows: PRow[];
  map?: { title: string; entries: PEntry[] };
  grid?: { title: string; cells: PCell[][] };
  /** Bars (heights), for problems about walls and water. */
  bars?: {
    values: number[];
    tones?: Record<number, VizTone | undefined>;
    tags?: Record<number, string | undefined>;
    /** Water drawn on top of each bar. */
    water?: number[];
    /** A container drawn between two bars at a water level. */
    box?: { l: number; r: number; level: number };
  };
  vars: { name: string; value: string; tone?: VizTone }[];
  /** Basic operations so far (hash lookups/inserts, array reads/writes). */
  ops: number;
  /** Shown on the final step. */
  answer?: string;
}

export interface PatternProblem<I> {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  blind75: boolean;
  /** LeetCode slug, e.g. "two-sum". */
  slug: string;
  /** NeetCode's YouTube video id for this problem. */
  video: string;
  /** The problem in our own words. */
  statement: string;
  examples: { label: string; input: I }[];
  random: (seed: number) => I;
  /** A bigger worst-case-style input, to compare the work at scale. */
  big?: { label: string; input: () => I };
  describe: (input: I) => string;
  run: (input: I) => PatternStep[];
  /** The optimal answer, in a form the tests can compare. */
  solve: (input: I) => unknown;
  /** The obvious slow way, counting its basic operations. Null when there's no fair brute force. */
  brute: ((input: I) => { answer: unknown; ops: number }) | null;
  bruteIdea: string;
  /** Normalise an answer so equivalent answers compare equal (e.g. any order). */
  canon?: (answer: unknown) => unknown;
  guide: AlgorithmGuide;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyProblem = PatternProblem<any>;
