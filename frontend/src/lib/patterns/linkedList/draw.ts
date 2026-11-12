// Helpers for drawing linked lists: pointer tags and arrows from a `next` map.

import type { VizTone } from "../../guides/types";
import type { LEdge } from "../types";

/** Joins pointer names by node: [["prev", "n1"], ["curr", "n2"]] → { n1: "prev", n2: "curr" }. */
export function tagsOf(ptrs: [string, string | null | undefined][]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, id] of ptrs) if (id) out[id] = out[id] ? `${out[id]} ${name}` : name;
  return out;
}

/** Arrows for every non-null entry of a next map. */
export function edgesOf(next: Record<string, string | null>, tone: (from: string, to: string) => VizTone | undefined = () => undefined): LEdge[] {
  return Object.entries(next)
    .filter((e): e is [string, string] => e[1] !== null)
    .map(([from, to]) => ({ from, to, tone: tone(from, to) }));
}

/** Follows next pointers from a node, returning the ids visited (stops on a repeat). */
export function walk(next: Record<string, string | null>, from: string | null): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (let id = from; id && !seen.has(id); id = next[id] ?? null) {
    seen.add(id);
    out.push(id);
  }
  return out;
}
