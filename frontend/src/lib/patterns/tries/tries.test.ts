import { describe, expect, it } from "vitest";

import { TRIES } from "./index";
import { insertWord, newTrie, trieLayout } from "./trie";

const get = (id: string) => TRIES.find((p) => p.id === id)!;
const inputs = (id: string) => [...get(id).examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => get(id).random(s + 1))];

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(get("implement-trie").solve(get("implement-trie").examples[0].input)).toBe("[true, false, true, true]");
    expect(get("word-dictionary").solve(get("word-dictionary").examples[0].input)).toBe("[false, true, true, true]");
    expect(get("word-search-ii").solve(get("word-search-ii").examples[0].input)).toBe("[eat, oath]");
    expect(get("word-search-ii").solve(get("word-search-ii").examples[1].input)).toBe("[car, cart, cat, cats]");
  });
});

describe("the animations", () => {
  it("records a successful dictionary search on the frame that announces it", () => {
    const frames = get("word-dictionary").run({ calls: ["addWord bad", "search b.."] });
    const found = frames.find((s) => s.stage === "found")!;
    expect(found.vars.find((v) => v.name === "results (search)")!.value).toBe("[true]");
    expect(frames.at(-1)!.answer).toBe("[true]");
    expect(frames.find((s) => s.stage === "walk")!.rows[1].cells.find((c) => c.tone === "current")!.v).toBe("b");
    for (const frame of frames.filter((s) => s.stage === "dot")) {
      expect(frame.rows[1].cells.find((c) => c.tone === "compare")!.v).toBe(".");
    }
  });
  it("the answer shown matches the slow solution", () => {
    for (const p of TRIES)
      for (const input of inputs(p.id)) expect(p.run(input).at(-1)!.answer, `${p.title}: ${p.describe(input)}`).toBe(p.solve(input));
  });
  it("trie pictures: no two nodes share a spot, every child is one row below its parent, and it spells the stored prefixes", () => {
    for (const p of TRIES)
      for (const input of inputs(p.id).slice(0, 80))
        for (const st of p.run(input)) {
          const nodes = st.tree!.nodes;
          const spots = nodes.map((n) => `${n.x},${n.depth}`);
          expect(new Set(spots).size, p.title).toBe(spots.length);
          const byId = new Map(nodes.map((n) => [n.id, n]));
          for (const n of nodes) {
            if (!n.parent) continue;
            expect(n.depth).toBe(byId.get(n.parent)!.depth + 1);
            // ids are the prefix spelled so far, so a child's id is its parent's plus its letter
            expect(n.id).toBe(n.parent + n.v);
          }
        }
  });
  it("inserting all the words gives a ring on exactly the stored words", () => {
    const root = newTrie();
    for (const w of ["car", "cat", "cart", "ca"]) insertWord(root, w);
    const rings = trieLayout(root)
      .filter((n) => n.ring)
      .map((n) => n.id.slice(1))
      .sort();
    expect(rings).toEqual(["ca", "car", "cart", "cat"]);
  });
  it("Word Search II never walks off the board or reuses a cell on its path", () => {
    for (const input of inputs("word-search-ii").slice(0, 80))
      for (const st of get("word-search-ii").run(input)) {
        const path = st.grid!.cells.flat().filter((c) => c.tone === "current" || c.tone === "pointer" || c.tone === "found");
        expect(path.filter((c) => c.tone === "current").length).toBeLessThanOrEqual(1);
        const spelled = st.grid!.title.match(/“(.*)”/)?.[1] ?? "";
        expect(spelled.length, st.explanation).toBe(path.length);
      }
  });
  it("random inputs cover found and missing words", () => {
    const counts = inputs("word-search-ii").map((i) => (get("word-search-ii").solve(i) as string).split(",").length);
    expect(new Set(counts).size).toBeGreaterThan(1);
    for (const id of ["implement-trie", "word-dictionary"]) {
      const all = inputs(id).map((i) => get(id).solve(i) as string).join();
      expect(all, id).toContain("true");
      expect(all, id).toContain("false");
    }
  });
});
