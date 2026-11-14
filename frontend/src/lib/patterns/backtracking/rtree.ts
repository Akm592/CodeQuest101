// Recursion trees for the Backtracking page.
//
// A solver records every call as a node while it runs, and takes a cheap
// frame at each step (the current node and path, and how many results and
// dead ends exist so far). When it's done, `finish` lays the whole tree out
// once, so nodes never move, and each step shows only the nodes visited so far.

import type { VizTone } from "../../guides/types";
import type { PatternStep, TNode } from "../types";

export interface RNode {
  id: string;
  label: string;
  parent?: string;
  depth: number;
  kids: string[];
}

/** Big inputs only need the op count; drawing thousands of nodes per step would be wasted work. */
const MAX_DRAWN = 400;

export class RecTree {
  nodes: RNode[] = [];
  private byId = new Map<string, RNode>();
  /** Result leaves and dead ends, in the order they were found. */
  found: string[] = [];
  dead: string[] = [];
  /** A short note shown beside a node (e.g. the subset it stands for), set when the node is created. */
  notes = new Map<string, string>();

  add(label: string, parent?: string, note?: string): string {
    const id = `n${this.nodes.length}`;
    const p = parent ? this.byId.get(parent)! : undefined;
    const n: RNode = { id, label, parent, depth: p ? p.depth + 1 : 0, kids: [] };
    this.nodes.push(n);
    this.byId.set(id, n);
    p?.kids.push(id);
    if (note !== undefined) this.notes.set(id, note);
    return id;
  }
}

export interface Frame extends Omit<PatternStep, "tree"> {
  /** Nodes visited so far (the first `seen` nodes). */
  seen: number;
  cur?: string;
  path: string[];
  foundN: number;
  deadN: number;
}

/** A frame of the tree's current state; spread it into the step you push. */
export function at(t: RecTree, cur: string | undefined, path: string[]): Pick<Frame, "seen" | "cur" | "path" | "foundN" | "deadN"> {
  return { seen: t.nodes.length, cur, path: [...path], foundN: t.found.length, deadN: t.dead.length };
}

/** Lays the tree out once and turns frames into steps. */
export function finish(t: RecTree, frames: Frame[], title: string, noteAll = false): PatternStep[] {
  if (t.nodes.length > MAX_DRAWN) return frames.map(({ seen: _s, cur: _c, path: _p, foundN: _f, deadN: _d, ...st }) => st);
  const x = new Map<string, number>();
  let next = 0;
  const byId = new Map(t.nodes.map((n) => [n.id, n]));
  const place = (id: string): number => {
    const n = byId.get(id)!;
    const xs = n.kids.map(place);
    const v = xs.length ? (xs[0] + xs[xs.length - 1]) / 2 : next++;
    x.set(id, v);
    return v;
  };
  if (t.nodes.length) place(t.nodes[0].id);
  return frames.map(({ seen, cur, path, foundN, deadN, ...st }) => {
    const on = new Set(path);
    const found = new Set(t.found.slice(0, foundN));
    const dead = new Set(t.dead.slice(0, deadN));
    const tone = (id: string): VizTone | undefined => (id === cur ? (found.has(id) ? "found" : dead.has(id) ? "swap" : "current") : found.has(id) ? "found" : dead.has(id) ? "swap" : on.has(id) ? "pointer" : undefined);
    const nodes: TNode[] = t.nodes.slice(0, seen).map((n) => ({
      id: n.id,
      v: n.label,
      x: x.get(n.id)!,
      depth: n.depth,
      parent: n.parent,
      tone: tone(n.id),
      note: n.id === cur || (noteAll && found.has(n.id)) ? t.notes.get(n.id) : undefined,
      edgeTone: n.parent && on.has(n.id) && on.has(n.parent) ? "pointer" : undefined,
    }));
    return { ...st, tree: { title, nodes } };
  });
}
