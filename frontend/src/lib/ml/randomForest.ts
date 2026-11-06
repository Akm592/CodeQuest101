// Random forests: many decision trees, each grown on a bootstrap sample (rows
// drawn at random with replacement) and allowed to look at only a random
// subset of features at each split. Following scikit-learn, the forest's answer
// is the average of the trees' class probabilities (a "soft" vote).
//
// Each tree's left-out rows ("out-of-bag", about a third of them) give a free
// accuracy estimate, as Breiman and Cutler describe.

import type { BaseStep } from "../algorithms/types";
import { classify, fitTree, type LabeledPoint, type TreeNode, type TreeOptions } from "./decisionTree";
import { seededRng } from "./random";

export interface ForestTree {
  nodes: TreeNode[];
  /** Index into the training data of every row drawn (with repeats). */
  sample: number[];
  /** Rows never drawn for this tree. */
  outOfBag: number[];
}

export interface ForestOptions extends Omit<TreeOptions, "rng" | "maxFeatures"> {
  trees: number;
  /** Features to consider per split; √2 rounds to 1 for these 2-feature datasets (scikit-learn's "sqrt"). */
  maxFeatures: number;
  bootstrap: boolean;
  seed: number;
}

export function bootstrapIndices(n: number, rng: () => number): number[] {
  return Array.from({ length: n }, () => Math.floor(rng() * n));
}

export function fitForest(data: LabeledPoint[], o: ForestOptions): ForestTree[] {
  const rng = seededRng(o.seed);
  const out: ForestTree[] = [];
  for (let t = 0; t < o.trees; t++) {
    const sample = o.bootstrap ? bootstrapIndices(data.length, rng) : [...data.keys()];
    const drawn = new Set(sample);
    const outOfBag = [...data.keys()].filter((i) => !drawn.has(i));
    const nodes = fitTree(
      sample.map((i) => data[i]),
      { ...o, maxFeatures: o.maxFeatures, rng },
    );
    out.push({ nodes, sample, outOfBag });
  }
  return out;
}

/** One tree's class probabilities at a point: the class shares in its leaf. */
export function treeProbs(nodes: TreeNode[], p: { x: number; y: number }): number[] {
  const { leaf } = classify(nodes, p);
  const n = leaf.counts.reduce((a, b) => a + b, 0);
  return leaf.counts.map((c) => c / n);
}

/** The forest's probabilities: the average over the first `k` trees. */
export function forestProbs(forest: ForestTree[], p: { x: number; y: number }, k = forest.length): number[] {
  let sum: number[] | null = null;
  for (let t = 0; t < k; t++) {
    const pr = treeProbs(forest[t].nodes, p);
    sum = sum ? sum.map((v, i) => v + pr[i]) : pr;
  }
  return sum!.map((v) => v / k);
}

const argmax = (xs: number[]) => xs.reduce((bi, v, i) => (v > xs[bi] ? i : bi), 0);

export function forestAccuracy(forest: ForestTree[], pts: LabeledPoint[], k = forest.length): number {
  return pts.filter((p) => argmax(forestProbs(forest, p, k)) === p.label).length / pts.length;
}

/**
 * Out-of-bag accuracy over the first `k` trees: each training row is judged
 * only by the trees that never saw it. Rows that every tree saw are skipped.
 */
export function oobAccuracy(forest: ForestTree[], data: LabeledPoint[], k = forest.length): { accuracy: number; covered: number } {
  let right = 0;
  let covered = 0;
  data.forEach((p, i) => {
    let sum: number[] | null = null;
    for (let t = 0; t < k; t++) {
      if (!forest[t].outOfBag.includes(i)) continue;
      const pr = treeProbs(forest[t].nodes, p);
      sum = sum ? sum.map((v, j) => v + pr[j]) : pr;
    }
    if (!sum) return;
    covered++;
    if (argmax(sum) === p.label) right++;
  });
  return { accuracy: covered ? right / covered : NaN, covered };
}

/** Chance that one particular row is never drawn in n draws with replacement. */
export const leftOutChance = (n: number) => (1 - 1 / n) ** n;

/** Chance that a majority of `voters` independent voters, each right with chance p, is right. */
export function majorityRight(voters: number, p: number): number {
  const choose = (n: number, k: number) => {
    let c = 1;
    for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
    return c;
  };
  let s = 0;
  for (let k = Math.floor(voters / 2) + 1; k <= voters; k++) s += choose(voters, k) * p ** k * (1 - p) ** (voters - k);
  return s;
}

export interface ForestStep extends BaseStep {
  k: number;
}

export function buildForestFrames(forest: ForestTree[], dataLength: number): ForestStep[] {
  return forest.map((t, i) => {
    const unique = new Set(t.sample).size;
    return {
      k: i + 1,
      explanation:
        i === 0
          ? `Tree 1 was grown on a bootstrap sample: ${dataLength} rows drawn with replacement, so only ${unique} different rows made it in and ${t.outOfBag.length} were left out. On its own it's just one jumpy tree.`
          : `Tree ${i + 1} gets its own random sample (${unique} different rows, ${t.outOfBag.length} left out) and its own random questions. The forest now averages ${i + 1} trees.`,
      done: i === forest.length - 1,
    };
  });
}
