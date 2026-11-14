// Shared pieces for Course Schedule I and II: drawing the prerequisite graph,
// random inputs, and the slow "keep taking whatever's ready" method.

import type { VizTone } from "../../guides/types";
import { rngFor } from "../helpers";
import type { GEdge, GNode } from "../types";

/** [a, b] means: to take course a, first take course b. */
export type Prereqs = [number, number][];
export type CoursesInput = { n: number; prereqs: Prereqs };

/** Nodes for each course and an arrow b → a for each [a, b] (take b, then a). */
export function courseGraph(n: number, prereqs: Prereqs, tone: (c: number) => VizTone | undefined, edgeTone: (a: number, b: number) => VizTone | undefined, tag?: (c: number) => string | undefined) {
  const nodes: GNode[] = Array.from({ length: n }, (_, c) => ({ id: `c${c}`, v: String(c), tone: tone(c), tag: tag?.(c) }));
  const edges: GEdge[] = prereqs.map(([a, b]) => ({ a: `c${b}`, b: `c${a}`, tone: edgeTone(a, b) }));
  return { title: "prerequisites: an arrow b → a means take b before a", nodes, edges, directed: true };
}

export function randomCourses(seed: number): CoursesInput {
  const g = rngFor(seed);
  const n = g.int(2, 6);
  const prereqs: Prereqs = [];
  const seen = new Set<string>();
  for (let i = 0; i < g.int(1, n + 1); i++) {
    const a = g.int(0, n - 1);
    const b = g.int(0, n - 1);
    if (a === b || seen.has(`${a},${b}`)) continue;
    seen.add(`${a},${b}`);
    prereqs.push([a, b]);
  }
  return { n, prereqs };
}

/** The slow way: keep scanning all courses for one whose prerequisites are all taken. */
export function takeWhatsReady({ n, prereqs }: CoursesInput): { order: number[]; ops: number } {
  const taken = new Set<number>();
  const order: number[] = [];
  let ops = 0;
  for (let progress = true; progress; ) {
    progress = false;
    for (let c = 0; c < n; c++) {
      if (taken.has(c)) continue;
      ops++;
      const ready = prereqs.every(([a, b]) => {
        if (a !== c) return true;
        ops++;
        return taken.has(b);
      });
      if (ready) {
        taken.add(c);
        order.push(c);
        progress = true;
      }
    }
  }
  return { order: order.length === n ? order : [], ops };
}

/** A long chain where each course needs the next one: the slow way takes one course per full scan. */
export const chainCourses = (n: number): CoursesInput => ({ n, prereqs: Array.from({ length: n - 1 }, (_, i): [number, number] => [i, i + 1]) });
