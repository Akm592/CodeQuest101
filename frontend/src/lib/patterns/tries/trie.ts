// Trie helpers for the Tries page: a plain trie and its layout for TreeView.
//
// Node ids are the prefix they spell ("^" for the root, "^ca" for c → a), so
// the same node keeps its id from step to step.

import type { VizTone } from "../../guides/types";
import type { TNode } from "../types";

export interface Trie {
  id: string;
  ch: string;
  kids: Map<string, Trie>;
  end: boolean;
}

export const newTrie = (): Trie => ({ id: "^", ch: "", kids: new Map(), end: false });

/** The child for ch, created if missing. Returns [child, created]. */
export function child(t: Trie, ch: string): [Trie, boolean] {
  const have = t.kids.get(ch);
  if (have) return [have, false];
  const made: Trie = { id: t.id + ch, ch, kids: new Map(), end: false };
  t.kids.set(ch, made);
  return [made, true];
}

export function insertWord(root: Trie, w: string): Trie {
  let t = root;
  for (const ch of w) t = child(t, ch)[0];
  t.end = true;
  return t;
}

export function countNodes(t: Trie): number {
  let n = 1;
  for (const k of t.kids.values()) n += countNodes(k);
  return n;
}

export interface TrieLayoutOpts {
  tone?: (t: Trie) => VizTone | undefined;
  tag?: (t: Trie) => string | undefined;
  note?: (t: Trie) => string | undefined;
  edgeTone?: (t: Trie) => VizTone | undefined;
  /** Leave these nodes (and their subtrees) out. */
  hide?: (t: Trie) => boolean;
}

/**
 * Nodes for TreeView. Children are in alphabetical order; each leaf gets the
 * next column and a parent sits midway over its first and last child, so no
 * two nodes overlap however many children there are.
 */
export function trieLayout(root: Trie, o: TrieLayoutOpts = {}): TNode[] {
  const out: TNode[] = [];
  let next = 0;
  const go = (t: Trie, depth: number, parent?: string): number => {
    const kids = [...t.kids.values()].filter((k) => !o.hide?.(k)).sort((a, b) => (a.ch < b.ch ? -1 : 1));
    const node: TNode = { id: t.id, v: t.ch, x: 0, depth, parent, tone: o.tone?.(t), tag: o.tag?.(t), note: o.note?.(t), edgeTone: o.edgeTone?.(t), ring: t.end };
    out.push(node);
    if (!kids.length) node.x = next++;
    else {
      const xs = kids.map((k) => go(k, depth + 1, t.id));
      node.x = (xs[0] + xs[xs.length - 1]) / 2;
    }
    return node.x;
  };
  go(root, 0);
  return out;
}

/** The ids on the path that spells w (as far as it exists), root first. */
export function pathIds(root: Trie, w: string): string[] {
  const ids = [root.id];
  let t: Trie | undefined = root;
  for (const ch of w) {
    t = t.kids.get(ch);
    if (!t) break;
    ids.push(t.id);
  }
  return ids;
}

/** A small "root" label over the root, for TreeView's labels. */
export const rootLabel = (nodes: TNode[]) => {
  const r = nodes.find((n) => n.depth === 0)!;
  return [{ x: r.x + 0.08, text: "root" }];
};
