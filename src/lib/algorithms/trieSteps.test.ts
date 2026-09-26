import { describe, expect, it } from "vitest";

import { layoutTrie } from "./trieLayout";
import { buildTrieSteps, TRIE_DEMO_WORDS, type TrieScript } from "./trieSteps";
import { assertStepInvariants } from "./testHelpers";

const seed: TrieScript[] = TRIE_DEMO_WORDS.map((word) => ({ op: "insert" as const, word }));

/** Every distinct non-empty prefix of the seeded words — the node count a correct trie must have. */
function distinctPrefixes(words: string[]): Set<string> {
  const out = new Set<string>();
  for (const w of words) {
    for (let i = 1; i <= w.length; i++) out.add(w.slice(0, i));
  }
  return out;
}

describe("trie", () => {
  it("stores exactly one node per distinct prefix", () => {
    const { finalNodes } = buildTrieSteps(seed);
    // Minus the root, which spells "".
    expect(finalNodes.length - 1).toBe(distinctPrefixes(TRIE_DEMO_WORDS).size);
  });

  it("finds every word it inserted", () => {
    for (const word of TRIE_DEMO_WORDS) {
      const { results } = buildTrieSteps([...seed, { op: "search", word }]);
      expect(results[results.length - 1], `search("${word}")`).toBe(true);
    }
  });

  it("does not treat a prefix as a word", () => {
    // The point of the whole visualizer: every character of "ca" matches and it
    // is still not a word, because nothing marked it as the end of one.
    const { results } = buildTrieSteps([...seed, { op: "search", word: "ca" }]);
    expect(results[results.length - 1]).toBe(false);
  });

  it("does treat an inserted prefix as a word", () => {
    // "do" is both a prefix of "dog" and a word in its own right.
    const { results } = buildTrieSteps([...seed, { op: "search", word: "do" }]);
    expect(results[results.length - 1]).toBe(true);
  });

  it("rejects a word that runs off the end of the trie", () => {
    const { results } = buildTrieSteps([...seed, { op: "search", word: "cats" }]);
    expect(results[results.length - 1]).toBe(false);
  });

  it("returns every completion of a prefix, sorted", () => {
    const { results } = buildTrieSteps([...seed, { op: "prefix", word: "ca" }]);
    expect(results[results.length - 1]).toEqual(["car", "card", "care", "cat"]);
  });

  it("returns nothing for an absent prefix", () => {
    const { results } = buildTrieSteps([...seed, { op: "prefix", word: "zz" }]);
    expect(results[results.length - 1]).toEqual([]);
  });

  it("adds no nodes when inserting a duplicate", () => {
    const once = buildTrieSteps(seed).finalNodes.length;
    const twice = buildTrieSteps([...seed, { op: "insert", word: "card" }]).finalNodes.length;
    expect(twice).toBe(once);
  });

  it("shares prefixes rather than duplicating them", () => {
    // "car" after "cat" should create exactly one node: 'r'. If the trie were
    // duplicating prefixes it would create three.
    const { steps } = buildTrieSteps([
      { op: "insert", word: "cat" },
      { op: "insert", word: "car" },
    ]);
    const createdForCar = steps.filter((s) => s.action === "create" && s.word === "car");
    expect(createdForCar.length).toBe(1);
    expect(createdForCar[0].nodeId).toBe("car");
  });

  it("marks exactly the inserted words as ends", () => {
    const { finalNodes } = buildTrieSteps(seed);
    const ends = finalNodes.filter((n) => n.isEnd).map((n) => n.id).sort();
    expect(ends).toEqual([...TRIE_DEMO_WORDS].sort());
  });

  it("holds the shared invariants", () => {
    const { steps } = buildTrieSteps(seed);
    assertStepInvariants(steps, {
      snapshot: (s) => s.nodes,
    });
  });
});

describe("trie layout", () => {
  const { finalNodes } = buildTrieSteps(seed);

  it("gives every node a position", () => {
    const { positions } = layoutTrie(finalNodes);
    expect(positions.size).toBe(finalNodes.length);
  });

  it("never puts two nodes at the same depth on the same x", () => {
    // Exactly the property the binary layout in TreeVisualizer would fail on an
    // n-ary trie.
    const { positions } = layoutTrie(finalNodes);
    const byDepth = new Map<number, number[]>();
    for (const [id, point] of positions) {
      const depth = id.length;
      const xs = byDepth.get(depth) ?? [];
      xs.push(point.x);
      byDepth.set(depth, xs);
    }
    for (const [depth, xs] of byDepth) {
      expect(new Set(xs).size, `depth ${depth} has overlapping nodes`).toBe(xs.length);
    }
  });

  it("centres every parent over its children", () => {
    const { positions } = layoutTrie(finalNodes);
    const childrenOf = new Map<string, string[]>();
    for (const node of finalNodes) {
      if (node.parentId === null) continue;
      childrenOf.set(node.parentId, [...(childrenOf.get(node.parentId) ?? []), node.id]);
    }
    for (const [parent, children] of childrenOf) {
      const px = positions.get(parent)?.x as number;
      const xs = children.map((c) => positions.get(c)?.x as number);
      expect(px, `${parent} sits left of its children`).toBeGreaterThanOrEqual(Math.min(...xs));
      expect(px, `${parent} sits right of its children`).toBeLessThanOrEqual(Math.max(...xs));
    }
  });

  it("puts deeper nodes lower", () => {
    const { positions } = layoutTrie(finalNodes);
    for (const [id, point] of positions) {
      expect(point.y).toBe(id.length * 74);
    }
  });

  it("handles an empty trie", () => {
    const { positions, width, height } = layoutTrie([]);
    expect(positions.size).toBe(0);
    expect(width).toBe(0);
    expect(height).toBe(0);
  });
});
