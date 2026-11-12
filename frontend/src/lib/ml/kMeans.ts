// K-means clustering, as alternating assign / update frames.
//
// Assign: every point joins its nearest centre. Update: every centre moves to
// the mean of its points. Repeat until an assign step changes nothing. The
// total squared distance (inertia) can only go down at each half-step, which
// is why it always stops, though not always at the best grouping.

import type { BaseStep } from "../algorithms/types";
import { seededRng, type Point } from "./random";

export type KMeansInit = "random" | "plusplus";

export interface KMeansStep extends BaseStep {
  phase: "init" | "assign" | "update" | "converged" | "stopped";
  iter: number;
  centroids: Point[];
  /** Where each centre was before this update, for drawing its move. */
  previous?: Point[];
  /** Cluster index per point, or -1 before the first assignment. */
  assignment: number[];
  inertia: number | null;
  /** Inertia after each update so far. */
  inertias: number[];
  /** Points that changed cluster in this assign step. */
  changed?: number;
}

const d2 = (a: Point, b: Point) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export function nearest(p: Point, centroids: Point[]): number {
  let best = 0;
  for (let c = 1; c < centroids.length; c++) if (d2(p, centroids[c]) < d2(p, centroids[best])) best = c;
  return best;
}

export function inertiaOf(points: Point[], centroids: Point[], assignment: number[]): number {
  return points.reduce((s, p, i) => s + d2(p, centroids[assignment[i]]), 0);
}

export function initCentroids(points: Point[], k: number, init: KMeansInit, seed: number): Point[] {
  const rng = seededRng(seed);
  if (init === "random") {
    const idx = [...points.keys()];
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx.slice(0, k).map((i) => ({ ...points[i] }));
  }
  // k-means++: each new centre is picked with probability proportional to its
  // squared distance from the nearest centre already chosen.
  const out: Point[] = [{ ...points[Math.floor(rng() * points.length)] }];
  while (out.length < k) {
    const dist = points.map((p) => Math.min(...out.map((c) => d2(p, c))));
    const total = dist.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    let pick = points.length - 1;
    for (let i = 0; i < points.length; i++) {
      r -= dist[i];
      if (r <= 0) {
        pick = i;
        break;
      }
    }
    out.push({ ...points[pick] });
  }
  return out;
}

export function buildKMeansSteps(points: Point[], k: number, init: KMeansInit, seed: number, maxIters = 30): KMeansStep[] {
  const steps: KMeansStep[] = [];
  if (points.length < k) {
    return [
      {
        phase: "init",
        iter: 0,
        centroids: [],
        assignment: points.map(() => -1),
        inertia: null,
        inertias: [],
        explanation: `Need at least ${k} points for ${k} clusters. Click the plot to add some.`,
        done: true,
      },
    ];
  }

  let centroids = initCentroids(points, k, init, seed);
  let assignment = points.map(() => -1);
  const inertias: number[] = [];
  const copy = (cs: Point[]) => cs.map((c) => ({ ...c }));

  steps.push({
    phase: "init",
    iter: 0,
    centroids: copy(centroids),
    assignment: [...assignment],
    inertia: null,
    inertias: [],
    explanation:
      init === "plusplus"
        ? `Place ${k} centres with k-means++: each new one is likely to land far from the others.`
        : `Place ${k} centres on ${k} randomly chosen points.`,
  });

  for (let iter = 1; iter <= maxIters; iter++) {
    const next = points.map((p) => nearest(p, centroids));
    const changed = next.reduce((n, c, i) => n + (c !== assignment[i] ? 1 : 0), 0);
    assignment = next;
    const inertia = inertiaOf(points, centroids, assignment);

    if (changed === 0) {
      steps.push({
        phase: "converged",
        iter,
        centroids: copy(centroids),
        assignment: [...assignment],
        inertia,
        inertias: [...inertias],
        changed,
        explanation: `No point changed cluster, so the centres won't move again. Done after ${iter - 1} rounds. Inertia ${inertia.toFixed(2)}.`,
        done: true,
      });
      return steps;
    }

    steps.push({
      phase: "assign",
      iter,
      centroids: copy(centroids),
      assignment: [...assignment],
      inertia,
      inertias: [...inertias],
      changed,
      explanation: `Round ${iter}: each point joins its nearest centre. ${changed} point${changed === 1 ? "" : "s"} changed cluster.`,
    });

    const previous = copy(centroids);
    centroids = centroids.map((c, ci) => {
      const members = points.filter((_, i) => assignment[i] === ci);
      if (members.length === 0) return { ...c }; // an empty cluster keeps its centre
      return {
        x: members.reduce((a, p) => a + p.x, 0) / members.length,
        y: members.reduce((a, p) => a + p.y, 0) / members.length,
      };
    });
    const after = inertiaOf(points, centroids, assignment);
    inertias.push(after);
    steps.push({
      phase: "update",
      iter,
      centroids: copy(centroids),
      previous,
      assignment: [...assignment],
      inertia: after,
      inertias: [...inertias],
      explanation: `Move each centre to the average position of its points. Inertia (total squared distance) is now ${after.toFixed(2)}.`,
    });
  }

  const inertia = inertiaOf(points, centroids, assignment);
  steps.push({
    phase: "stopped",
    iter: maxIters,
    centroids: copy(centroids),
    assignment: [...assignment],
    inertia,
    inertias: [...inertias],
    explanation: `Stopped at the limit of ${maxIters} rounds. Assignments may still change; reaching this limit does not prove convergence.`,
    done: true,
  });
  return steps;
}
