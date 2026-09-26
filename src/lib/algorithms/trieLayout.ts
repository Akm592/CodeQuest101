// Tidy layout for an n-ary tree.
//
// TreeVisualizer.tsx already lays out a tree, but it computes a child's x as
// `x ± width / 2^(level+1)` — a binary assumption. A trie node can have up to
// 26 children, so that formula overlaps siblings by about depth 3 and is not
// reusable here. (Its framer-motion variants in trees/treeAnimations.ts are
// generic and worth importing; the layout is not.)
//
// Instead: post-order walk, each leaf takes the next x slot, each internal node
// centres over its children. Pure function, so the two properties that matter —
// no two nodes at one depth share an x, and every parent sits between its
// children — are unit-testable.

import type { TrieNodeSnapshot } from "./trieSteps";

export interface LayoutPoint {
  x: number;
  y: number;
}

export interface TrieLayoutOptions {
  /** Horizontal distance between adjacent leaves. */
  xGap?: number;
  /** Vertical distance between depths. */
  yGap?: number;
}

export interface TrieLayout {
  positions: Map<string, LayoutPoint>;
  width: number;
  height: number;
}

export function layoutTrie(
  nodes: TrieNodeSnapshot[],
  options: TrieLayoutOptions = {},
): TrieLayout {
  const { xGap = 56, yGap = 74 } = options;

  const positions = new Map<string, LayoutPoint>();
  if (nodes.length === 0) return { positions, width: 0, height: 0 };

  // Children in a stable order, so the drawing does not jump between frames as
  // Map iteration order changes.
  const childrenOf = new Map<string, string[]>();
  for (const node of nodes) {
    if (node.parentId === null) continue;
    const siblings = childrenOf.get(node.parentId) ?? [];
    siblings.push(node.id);
    childrenOf.set(node.parentId, siblings);
  }
  for (const siblings of childrenOf.values()) siblings.sort();

  const root = nodes.find((n) => n.parentId === null);
  if (!root) return { positions, width: 0, height: 0 };

  let nextLeafX = 0;
  let maxDepth = 0;

  // Iterative post-order: a deep trie should not be able to blow the stack.
  const stack: { id: string; visited: boolean }[] = [{ id: root.id, visited: false }];
  const depthOf = new Map<string, number>([[root.id, 0]]);

  while (stack.length > 0) {
    const frame = stack.pop() as { id: string; visited: boolean };
    const children = childrenOf.get(frame.id) ?? [];
    const depth = depthOf.get(frame.id) ?? 0;
    maxDepth = Math.max(maxDepth, depth);

    if (!frame.visited) {
      stack.push({ id: frame.id, visited: true });
      // Reversed, so popping yields them left to right.
      for (let i = children.length - 1; i >= 0; i--) {
        depthOf.set(children[i], depth + 1);
        stack.push({ id: children[i], visited: false });
      }
      continue;
    }

    if (children.length === 0) {
      positions.set(frame.id, { x: nextLeafX * xGap, y: depth * yGap });
      nextLeafX += 1;
    } else {
      const xs = children.map((c) => (positions.get(c) as LayoutPoint).x);
      positions.set(frame.id, {
        x: (Math.min(...xs) + Math.max(...xs)) / 2,
        y: depth * yGap,
      });
    }
  }

  const allX = [...positions.values()].map((p) => p.x);
  return {
    positions,
    width: allX.length ? Math.max(...allX) - Math.min(...allX) + xGap : 0,
    height: (maxDepth + 1) * yGap,
  };
}
