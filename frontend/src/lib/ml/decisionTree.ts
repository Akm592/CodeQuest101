// Decision trees for classification, built the CART way (as scikit-learn does):
// at each node, try every feature and every threshold between neighbouring
// values, and keep the split whose two sides are purest on average.
//
// Impurity, with p_k the share of class k in a node (scikit-learn's formulas):
//   Gini     = Σ p_k (1 − p_k)        (= 1 − Σ p_k²)
//   entropy  = −Σ p_k log₂ p_k
// A split's score is the size-weighted impurity of its children; the gain is
// the parent's impurity minus that. Growth stops when a node is pure, the
// depth limit is reached, the node is too small, or no split helps.

import type { BaseStep } from "../algorithms/types";
import { gaussian, seededRng, type Rng } from "./random";

export type Criterion = "gini" | "entropy";

export interface LabeledPoint {
  x: number;
  y: number;
  label: number;
}

export function impurity(counts: number[], criterion: Criterion): number {
  const n = counts.reduce((a, b) => a + b, 0);
  if (n === 0) return 0;
  let s = 0;
  for (const c of counts) {
    if (c === 0) continue;
    const p = c / n;
    s += criterion === "gini" ? p * (1 - p) : -p * Math.log2(p);
  }
  return s;
}

export function countsOf(points: LabeledPoint[], classes: number): number[] {
  const c = new Array(classes).fill(0);
  for (const p of points) c[p.label]++;
  return c;
}

export interface Split {
  feature: "x" | "y";
  threshold: number;
  /** Weighted impurity of the two children. */
  score: number;
  gain: number;
  left: number[];
  right: number[];
}

/** Every candidate split on one feature, in order: thresholds halfway between neighbouring values. */
export function candidateSplits(points: LabeledPoint[], feature: "x" | "y", classes: number, criterion: Criterion): Split[] {
  const sorted = [...points].sort((a, b) => a[feature] - b[feature]);
  const parent = impurity(countsOf(points, classes), criterion);
  const n = points.length;
  const left = new Array(classes).fill(0);
  const right = countsOf(points, classes);
  const out: Split[] = [];
  for (let i = 0; i < n - 1; i++) {
    left[sorted[i].label]++;
    right[sorted[i].label]--;
    const a = sorted[i][feature];
    const b = sorted[i + 1][feature];
    if (a === b) continue; // can't separate equal values
    const nl = i + 1;
    const score = (nl / n) * impurity(left, criterion) + ((n - nl) / n) * impurity(right, criterion);
    out.push({ feature, threshold: (a + b) / 2, score, gain: parent - score, left: [...left], right: [...right] });
  }
  return out;
}

export function bestSplit(points: LabeledPoint[], classes: number, criterion: Criterion, features: ("x" | "y")[] = ["x", "y"]): Split | null {
  let best: Split | null = null;
  for (const f of features) {
    for (const s of candidateSplits(points, f, classes, criterion)) {
      // Strictly better only, so ties keep the first found (x before y, low threshold first).
      if (!best || s.score < best.score - 1e-12) best = s;
    }
  }
  return best;
}

/**
 * The split a random forest tree would choose: look at a random subset of
 * `maxFeatures` features first, and, like scikit-learn, keep looking at the
 * remaining features only if none of those gives a useful split.
 */
export function randomFeatureSplit(points: LabeledPoint[], classes: number, criterion: Criterion, maxFeatures: number, rng: Rng): Split | null {
  const order: ("x" | "y")[] = rng() < 0.5 ? ["x", "y"] : ["y", "x"];
  const first = bestSplit(points, classes, criterion, order.slice(0, maxFeatures));
  if (first && first.gain > 1e-12) return first;
  return bestSplit(points, classes, criterion, order.slice(maxFeatures));
}

export interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface TreeNode {
  id: number;
  depth: number;
  box: Box;
  counts: number[];
  impurity: number;
  prediction: number;
  split?: { feature: "x" | "y"; threshold: number; gain: number };
  left?: number;
  right?: number;
  /** Why this node is a leaf, once it is one. */
  leafReason?: string;
}

export interface TreeOptions {
  maxDepth: number;
  criterion: Criterion;
  minSamplesSplit?: number;
  classes: number;
  bounds: Box;
  /** Random forests: consider only this many random features at each split. */
  maxFeatures?: number;
  /** Required with maxFeatures. */
  rng?: Rng;
}

export interface TreeStep extends BaseStep {
  phase: "start" | "consider" | "split" | "leaf" | "done";
  nodes: TreeNode[];
  focus: number;
  candidate?: Split;
}

const argmax = (xs: number[]) => xs.reduce((bi, v, i) => (v > xs[bi] ? i : bi), 0);
const f3 = (v: number) => v.toFixed(3);

/** Build the tree depth-first (like CART's recursion), recording every decision. */
export function buildTreeSteps(points: LabeledPoint[], opts: TreeOptions, classNames: string[]): TreeStep[] {
  return growTree(points, opts, classNames, true).steps;
}

function growTree(points: LabeledPoint[], opts: TreeOptions, classNames: string[], record: boolean): { steps: TreeStep[]; nodes: TreeNode[] } {
  const { maxDepth, criterion, classes, bounds, minSamplesSplit = 2, maxFeatures, rng } = opts;
  const nodes: TreeNode[] = [];
  const steps: TreeStep[] = [];
  const snap = (phase: TreeStep["phase"], focus: number, explanation: string, candidate?: Split, done = false) => {
    if (!record) return;
    steps.push({ phase, focus, nodes: nodes.map((n) => ({ ...n, box: { ...n.box }, counts: [...n.counts], split: n.split && { ...n.split } })), candidate, explanation, done });
  };
  const describe = (c: number[]) => c.map((v, i) => `${v} ${classNames[i]}`).join(", ");

  const make = (pts: LabeledPoint[], depth: number, box: Box): number => {
    const counts = countsOf(pts, classes);
    const node: TreeNode = { id: nodes.length, depth, box, counts, impurity: impurity(counts, criterion), prediction: argmax(counts) };
    nodes.push(node);
    return node.id;
  };

  const grow = (id: number, pts: LabeledPoint[]) => {
    const node = nodes[id];
    const leaf = (reason: string) => {
      node.leafReason = reason;
      snap("leaf", id, `Leaf: ${reason} It predicts “${classNames[node.prediction]}” (${describe(node.counts)}).`);
    };
    if (node.impurity === 0) return leaf("every point here is the same class, so there's nothing left to ask.");
    if (node.depth >= maxDepth) return leaf(`the depth limit (${maxDepth}) is reached.`);
    if (pts.length < minSamplesSplit) return leaf("too few points to split.");
    const s = maxFeatures && rng ? randomFeatureSplit(pts, classes, criterion, maxFeatures, rng) : bestSplit(pts, classes, criterion);
    if (!s || s.gain <= 1e-12) return leaf("no single question makes the two sides any purer.");

    const name = s.feature;
    snap(
      "consider",
      id,
      `Try every question “Is ${name} ≤ t?” on these ${pts.length} points. The best is ${name} ≤ ${f3(s.threshold)}: ${criterion === "gini" ? "Gini" : "entropy"} drops from ${f3(node.impurity)} to ${f3(s.score)} (gain ${f3(s.gain)}).`,
      s,
    );
    const goesLeft = (p: LabeledPoint) => p[s.feature] <= s.threshold;
    const leftPts = pts.filter(goesLeft);
    const rightPts = pts.filter((p) => !goesLeft(p));
    const lb = { ...node.box };
    const rb = { ...node.box };
    if (s.feature === "x") {
      lb.x1 = s.threshold;
      rb.x0 = s.threshold;
    } else {
      lb.y1 = s.threshold;
      rb.y0 = s.threshold;
    }
    node.split = { feature: s.feature, threshold: s.threshold, gain: s.gain };
    node.left = make(leftPts, node.depth + 1, lb);
    node.right = make(rightPts, node.depth + 1, rb);
    snap("split", id, `Split: yes (${name} ≤ ${f3(s.threshold)}) goes left with ${describe(s.left)}; no goes right with ${describe(s.right)}.`);
    grow(node.left, leftPts);
    grow(node.right, rightPts);
  };

  const root = make(points, 0, { ...bounds });
  snap("start", root, `Start with all ${points.length} points in one group (${describe(nodes[root].counts)}). Its ${criterion === "gini" ? "Gini impurity" : "entropy"} is ${f3(nodes[root].impurity)}.`);
  grow(root, points);
  const leaves = nodes.filter((n) => !n.split).length;
  snap("done", root, `Done: ${nodes.length} nodes, ${leaves} leaves. Every region of the plot now has an answer.`, undefined, true);
  return { steps, nodes };
}

/** Walk a point down the tree; returns the leaf and the nodes visited. */
export function classify(nodes: TreeNode[], p: { x: number; y: number }): { leaf: TreeNode; path: number[] } {
  let n = nodes[0];
  const path = [n.id];
  while (n.split && n.left !== undefined && n.right !== undefined) {
    n = nodes[p[n.split.feature] <= n.split.threshold ? n.left : n.right];
    path.push(n.id);
  }
  return { leaf: n, path };
}

export function accuracyOf(nodes: TreeNode[], pts: LabeledPoint[]): number {
  return pts.filter((p) => classify(nodes, p).leaf.prediction === p.label).length / pts.length;
}

/** The finished tree only (no steps recorded), for charts and forests. */
export function fitTree(points: LabeledPoint[], opts: TreeOptions): TreeNode[] {
  return growTree(points, opts, Array.from({ length: opts.classes }, (_, i) => String(i)), false).nodes;
}

// ---------------------------------------------------------------------------
// Datasets on a 0–10 square.

export type TreeDatasetKey = "groups" | "diagonal" | "checker" | "noisy";

export const TREE_BOUNDS: Box = { x0: 0, x1: 10, y0: 0, y1: 10 };

export const TREE_DATASETS: Record<TreeDatasetKey, { label: string; blurb: string; classes: number; names: string[] }> = {
  groups: { label: "Three groups", blurb: "Three clusters. A few straight cuts separate them cleanly.", classes: 3, names: ["teal", "violet", "amber"] },
  diagonal: {
    label: "Diagonal",
    blurb: "The true border is a diagonal line. A tree can only cut straight across or straight up, so it builds a staircase.",
    classes: 2,
    names: ["teal", "violet"],
  },
  checker: {
    label: "Checkerboard",
    blurb: "Like XOR: no single first question helps much on its own, which is hard for a tree that picks one greedy question at a time.",
    classes: 2,
    names: ["teal", "violet"],
  },
  noisy: {
    label: "Noisy",
    blurb: "Two groups with some points given the wrong label. A deep tree memorises the noise; a shallow one ignores it.",
    classes: 2,
    names: ["teal", "violet"],
  },
};

export function makeTreeData(key: TreeDatasetKey, seed: number, n = 80): LabeledPoint[] {
  const rng = seededRng(seed);
  const clamp = (v: number) => Math.max(0.2, Math.min(9.8, v));
  const out: LabeledPoint[] = [];
  for (let i = 0; i < n; i++) {
    if (key === "groups") {
      const label = i % 3;
      const c = [
        [2.5, 7],
        [7, 7.5],
        [5, 2.5],
      ][label];
      out.push({ x: clamp(c[0] + gaussian(rng) * 1.1), y: clamp(c[1] + gaussian(rng) * 1.1), label });
    } else if (key === "diagonal") {
      const x = 0.2 + rng() * 9.6;
      const y = 0.2 + rng() * 9.6;
      out.push({ x, y, label: y > x ? 1 : 0 });
    } else if (key === "checker") {
      const x = 0.2 + rng() * 9.6;
      const y = 0.2 + rng() * 9.6;
      out.push({ x, y, label: (x < 5) === (y < 5) ? 0 : 1 });
    } else {
      const label = i % 2;
      const x = clamp((label ? 6.5 : 3.5) + gaussian(rng) * 1.6);
      const y = clamp((label ? 6 : 4) + gaussian(rng) * 1.6);
      out.push({ x, y, label: rng() < 0.15 ? 1 - label : label });
    }
  }
  return out;
}
