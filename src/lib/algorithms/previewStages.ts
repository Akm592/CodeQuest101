// The looping previews on the home page's Playground cards.
//
// Each preview replays the real step generator on a tiny input, so what a card
// shows is the algorithm itself rather than a drawing of it. What the cards add
// is a coarser vocabulary: the visualizer pages narrate every step in a full
// sentence, which is far too much to read on a card that loops. Here every step
// maps onto one of a handful of named stages — the algorithm's outline — and
// the card names the stage the animation is in.
//
// Pure: no React, no timers. Tested in previewStages.test.ts, which checks that
// every step lands on a stage and every stage is reached.

import type { Graph } from "../../components/Graphs/Types";
import { buildEditDistanceSteps, type DpStep, type DpTableLabels } from "./dpSteps";
import { buildTopoSortSteps, type TopoStep } from "./graphOrderingSteps";
import { buildNQueensSteps, type NQueensStep } from "./nQueensSteps";
import { buildTrieSteps, type TrieStep } from "./trieSteps";
import type { BaseStep } from "./types";

export type PreviewKey = "dynamicProgramming" | "topologicalSort" | "nQueens" | "trie";

export interface PreviewStage {
  id: string;
  /** Short enough to sit on one line of a card at phone width. */
  label: string;
}

export interface PreviewDemo<TStep extends BaseStep> {
  stages: readonly PreviewStage[];
  steps: TStep[];
  stageFor: (step: TStep) => string;
}

// ---------------------------------------------------------------------------
// Dynamic programming — edit distance, "cat" → "cut"
// ---------------------------------------------------------------------------

export const DP_PREVIEW_WORDS = { from: "cat", to: "cut" } as const;

export interface DpPreview extends PreviewDemo<DpStep> {
  labels: DpTableLabels;
}

export function buildDpPreview(): DpPreview {
  const { steps, labels } = buildEditDistanceSteps(DP_PREVIEW_WORDS.from, DP_PREVIEW_WORDS.to);
  return {
    steps,
    labels,
    stages: [
      { id: "base", label: "Fill the base row and column" },
      { id: "match", label: "Letters match → copy the diagonal" },
      { id: "mismatch", label: "Letters differ → 1 + cheapest neighbour" },
      { id: "trace", label: "Trace the cheapest path back" },
      { id: "answer", label: "The corner cell is the answer" },
    ],
    stageFor: (step) => {
      switch (step.phase) {
        case "init":
          return "base";
        case "fill":
          return labels.rowHeader[step.row] === labels.colHeader[step.col] ? "match" : "mismatch";
        case "traceback":
          return "trace";
        default:
          return "answer";
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Topological sort — Kahn's algorithm on a five-task build order
// ---------------------------------------------------------------------------

/**
 * A and B have no prerequisites; C needs both; E needs C and D. Small, but it
 * exercises every stage: C's count drops twice before it is ready, and E waits
 * on two branches.
 */
export const TOPO_PREVIEW_GRAPH: Graph = {
  nodes: ["A", "B", "C", "D", "E"],
  edges: [
    ["A", "C", 1],
    ["B", "C", 1],
    ["B", "D", 1],
    ["C", "E", 1],
    ["D", "E", 1],
  ],
  directed: true,
};

export function buildTopoPreview(): PreviewDemo<TopoStep> {
  const { steps } = buildTopoSortSteps(TOPO_PREVIEW_GRAPH);
  return {
    steps,
    stages: [
      { id: "count", label: "Count each node's incoming edges" },
      { id: "emit", label: "Output a node with none left" },
      { id: "decrement", label: "Remove its edges: counts drop" },
      { id: "ready", label: "Count hits 0 → node is ready" },
      { id: "done", label: "Every node ordered" },
    ],
    stageFor: (step) => {
      switch (step.action) {
        case "init":
          return "count";
        case "emit":
          return "emit";
        case "decrement":
          return "decrement";
        case "enqueue":
          return "ready";
        default:
          return "done";
      }
    },
  };
}

// ---------------------------------------------------------------------------
// N-Queens — first solution on a 4×4 board
// ---------------------------------------------------------------------------

export const QUEENS_PREVIEW_SIZE = 4;

export function buildQueensPreview(): PreviewDemo<NQueensStep> {
  // "try" steps are dropped: each is immediately followed by a conflict or a
  // place on the same square, which already shows the attempt. Keeping them
  // doubles the loop length for no extra information at card size.
  const steps = buildNQueensSteps(QUEENS_PREVIEW_SIZE, { firstOnly: true }).steps.filter(
    (s) => s.action !== "try",
  );
  return {
    steps,
    stages: [
      { id: "place", label: "Safe square → place a queen, next row" },
      { id: "conflict", label: "Attacked → reject that square" },
      { id: "undo", label: "Row has no safe square → undo" },
      { id: "solved", label: "Every row has a queen: solved" },
    ],
    stageFor: (step) => {
      switch (step.action) {
        case "conflict":
          return "conflict";
        case "undo":
          return "undo";
        case "solution":
        case "exhausted":
          return "solved";
        default:
          return "place";
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Trie — insert "car", "cat", "do"
// ---------------------------------------------------------------------------

export const TRIE_PREVIEW_WORDS = ["car", "cat", "do"] as const;

/** Gaps the card lays the preview trie out with; its viewBox assumes them. */
export const MINI_TRIE_GAPS = { xGap: 34, yGap: 30 } as const;

export function buildTriePreview(): PreviewDemo<TrieStep> {
  const { steps } = buildTrieSteps(TRIE_PREVIEW_WORDS.map((word) => ({ op: "insert" as const, word })));
  return {
    steps,
    stages: [
      { id: "start", label: "Start at the root" },
      { id: "create", label: "New letter → add a node" },
      { id: "reuse", label: "Letter already there → reuse it" },
      { id: "end", label: "Mark where the word ends" },
      { id: "done", label: "Shared prefixes, shared nodes" },
    ],
    stageFor: (step) => {
      switch (step.action) {
        case "start":
          return "start";
        case "create":
          return "create";
        case "descend":
          return "reuse";
        case "mark-end":
          return "end";
        default:
          return "done";
      }
    },
  };
}
