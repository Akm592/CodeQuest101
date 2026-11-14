import { describe, expect, it } from "vitest";

import { BACKTRACKING } from "./index";

const get = (id: string) => BACKTRACKING.find((p) => p.id === id)!;
const inputs = (id: string) => [...get(id).examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => get(id).random(s + 1))];

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(get("subsets").solve([1, 2, 3])).toBe("[[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]");
    expect(get("combination-sum").solve({ candidates: [2, 3, 6, 7], target: 7 })).toBe("[[2, 2, 3], [7]]");
    expect(get("combination-sum").solve({ candidates: [2, 3, 5], target: 8 })).toBe("[[2, 2, 2, 2], [2, 3, 3], [3, 5]]");
    expect(get("permutations").solve([0, 1])).toBe("[[0, 1], [1, 0]]");
    expect(get("subsets-ii").solve([1, 2, 2])).toBe("[[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]");
    expect(get("combination-sum-ii").solve({ candidates: [10, 1, 2, 7, 6, 1, 5], target: 8 })).toBe("[[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]]");
    expect(get("word-search").solve({ board: ["ABCE", "SFCS", "ADEE"], word: "ABCCED" })).toBe(true);
    expect(get("word-search").solve({ board: ["ABCE", "SFCS", "ADEE"], word: "ABCB" })).toBe(false);
    expect(get("palindrome-partitioning").solve("aab")).toBe("[[a, a, b], [aa, b]]");
    expect(get("letter-combinations").solve("23")).toBe("[ad, ae, af, bd, be, bf, cd, ce, cf]");
    expect(get("n-queens").solve(4)).toBe("[[..Q., Q..., ...Q, .Q..], [.Q.., ...Q, Q..., ..Q.]]");
  });
  it("N-Queens finds the known number of solutions", () => {
    for (const [n, c] of [[1, 1], [2, 0], [3, 0], [4, 2], [5, 10], [6, 4], [7, 40]] as const) expect(get("n-queens").run(n).filter((s) => s.stage === "solution").length).toBe(c);
  });
});

describe("the animations", () => {
  it("the answer shown matches the slow solution", () => {
    for (const p of BACKTRACKING) for (const input of inputs(p.id)) expect(p.run(input).at(-1)!.answer, `${p.title}: ${p.describe(input)}`).toBe(String(p.solve(input)));
  });
  it("recursion trees: nodes never move, every child is one level below its parent, and no two share a spot", () => {
    for (const p of BACKTRACKING)
      for (const input of inputs(p.id).slice(0, 60)) {
        const steps = p.run(input).filter((s) => s.tree);
        const spot = new Map<string, string>();
        for (const st of steps) {
          const byId = new Map(st.tree!.nodes.map((n) => [n.id, n]));
          const spots = st.tree!.nodes.map((n) => `${n.x},${n.depth}`);
          expect(new Set(spots).size, p.title).toBe(spots.length);
          for (const n of st.tree!.nodes) {
            const key = `${n.x},${n.depth}`;
            expect(spot.get(n.id) ?? key, `${p.title}: ${n.id} moved`).toBe(key);
            spot.set(n.id, key);
            if (n.parent) expect(byId.get(n.parent)!.depth).toBe(n.depth - 1);
          }
        }
      }
  });
  it("each step shows one more node at most, so the tree grows as the search goes", () => {
    for (const p of BACKTRACKING)
      for (const input of inputs(p.id).slice(0, 60)) {
        let prev = 0;
        for (const st of p.run(input)) {
          if (!st.tree) continue;
          expect(st.tree.nodes.length - prev, p.title).toBeLessThanOrEqual(1);
          expect(st.tree.nodes.length).toBeGreaterThanOrEqual(prev);
          prev = st.tree.nodes.length;
        }
      }
  });
  it("Word Search: the numbered path always spells the start of the word, and cells are next to each other", () => {
    for (const input of inputs("word-search"))
      for (const st of get("word-search").run(input)) {
        const cells = st.grid!.cells.flatMap((line, r) => line.map((c, x) => ({ ...c, r, x }))).filter((c) => c.tag);
        cells.sort((a, b) => Number(a.tag) - Number(b.tag));
        expect(cells.map((c) => c.v).join(""), st.explanation).toBe(input.word.slice(0, cells.length));
        for (let i = 1; i < cells.length; i++) expect(Math.abs(cells[i].r - cells[i - 1].r) + Math.abs(cells[i].x - cells[i - 1].x)).toBe(1);
      }
  });
  it("N-Queens: the queens on the board never attack each other except in an “attacked” step", () => {
    for (const n of [4, 5, 6])
      for (const st of get("n-queens").run(n)) {
        const q = st.grid!.cells.flatMap((line, r) => line.map((c, x) => ({ v: c.v, r, x }))).filter((c) => c.v === "♛");
        for (const a of q) for (const b of q) if (a !== b) expect(a.x === b.x || Math.abs(a.r - b.r) === Math.abs(a.x - b.x), st.explanation).toBe(false);
      }
  });
  it("random inputs cover both answers for Word Search", () => {
    expect(new Set(inputs("word-search").map((i) => get("word-search").solve(i)))).toEqual(new Set([true, false]));
  });
});
