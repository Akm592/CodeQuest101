import { describe, expect, it } from "vitest";

import { GRAPHS } from "./index";
import { INF } from "./wallsAndGates";

const get = (id: string) => GRAPHS.find((p) => p.id === id)!;
const inputs = (id: string) => [...get(id).examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => get(id).random(s + 1))];

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(get("num-islands").solve(["11110", "11010", "11000", "00000"])).toBe(1);
    expect(get("num-islands").solve(["11000", "11000", "00100", "00011"])).toBe(3);
    expect(get("max-area-island").solve(["11000", "11011", "00010", "10011"])).toBe(5);
    expect(get("pacific-atlantic").solve(get("pacific-atlantic").examples[0].input)).toBe("[[0,4], [1,3], [1,4], [2,2], [3,0], [3,1], [4,0]]");
    expect(get("surrounded-regions").solve(["XXXX", "XOOX", "XXOX", "XOXX"])).toBe("[XXXX, XXXX, XXXX, XOXX]");
    expect(get("rotting-oranges").solve([[2, 1, 1], [1, 1, 0], [0, 1, 1]])).toBe(4);
    expect(get("rotting-oranges").solve([[2, 1, 1], [0, 1, 1], [1, 0, 1]])).toBe(-1);
    expect(get("rotting-oranges").solve([[0, 2]])).toBe(0);
    expect(get("walls-and-gates").solve(get("walls-and-gates").examples[0].input)).toBe("[[3,-1,0,1], [2,2,1,-1], [1,-1,2,-1], [0,-1,3,4]]");
    expect(get("course-schedule").solve({ n: 2, prereqs: [[1, 0]] })).toBe(true);
    expect(get("course-schedule").solve({ n: 2, prereqs: [[1, 0], [0, 1]] })).toBe(false);
    expect(get("redundant-connection").solve([[1, 2], [1, 3], [2, 3]])).toBe("[2,3]");
    expect(get("redundant-connection").solve([[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]])).toBe("[1,4]");
    expect(get("connected-components").solve({ n: 5, edges: [[0, 1], [1, 2], [3, 4]] })).toBe(2);
    expect(get("graph-valid-tree").solve({ n: 5, edges: [[0, 1], [0, 2], [0, 3], [1, 4]] })).toBe(true);
    expect(get("graph-valid-tree").solve({ n: 5, edges: [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]] })).toBe(false);
    expect(get("word-ladder").solve(get("word-ladder").examples[0].input)).toBe(5);
    expect(get("word-ladder").solve(get("word-ladder").examples[1].input)).toBe(0);
    expect(get("word-ladder").solve(get("word-ladder").examples[2].input)).toBe(5);
  });
});

describe("the animations", () => {
  it("the answer shown matches the slow or cross-check solution", () => {
    for (const p of GRAPHS)
      for (const input of inputs(p.id)) {
        const shown = p.run(input).at(-1)!.answer;
        const want = String(p.solve(input));
        expect(p.canon ? p.canon(shown) : shown, `${p.title}: ${p.describe(input)}`).toBe(p.canon ? p.canon(want) : want);
      }
  });
  it("Course Schedule II's order puts every course after its prerequisites", () => {
    for (const input of inputs("course-schedule-ii")) {
      const ans = get("course-schedule-ii").run(input).at(-1)!.answer!;
      if (ans === "[]") continue;
      const order = ans.slice(1, -1).split(", ").map(Number);
      expect(order.length).toBe(input.n);
      const at = new Map(order.map((c, i) => [c, i]));
      for (const [a, b] of input.prereqs) expect(at.get(b)!, ans).toBeLessThan(at.get(a)!);
    }
  });
  it("Clone Graph's copy has the same shape as the original", () => {
    for (const adj of inputs("clone-graph")) expect(get("clone-graph").run(adj).at(-1)!.answer).toBe(`[${adj.map((l: number[]) => `[${l.join(",")}]`).join(", ")}]`);
  });
  it("Walls and Gates: every filled room is one more than some neighbour, and gates and walls are untouched", () => {
    for (const g of inputs("walls-and-gates")) {
      const ans = get("walls-and-gates").run(g).at(-1)!.answer!;
      const out: number[][] = JSON.parse(ans.replace(/INF/g, String(INF)).replace(/\], \[/g, "],["));
      out.forEach((line, r) =>
        line.forEach((v, c) => {
          if (g[r][c] !== INF) expect(v).toBe(g[r][c]);
          else if (v !== INF) expect([[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].some(([y, x]) => out[y]?.[x] === v - 1)).toBe(true);
        }),
      );
    }
  });
  it("graph pictures: every edge joins two drawn nodes", () => {
    for (const p of GRAPHS)
      for (const input of inputs(p.id).slice(0, 60))
        for (const st of p.run(input)) {
          if (!st.graph) continue;
          const ids = new Set(st.graph.nodes.map((n) => n.id));
          for (const e of st.graph.edges) expect(ids.has(e.a) && ids.has(e.b), `${p.title}: ${e.a}–${e.b}`).toBe(true);
        }
  });
  it("random inputs cover both answers for the yes/no problems", () => {
    for (const id of ["course-schedule", "graph-valid-tree"]) expect(new Set(inputs(id).map((i) => get(id).solve(i))), id).toEqual(new Set([true, false]));
    expect(new Set(inputs("rotting-oranges").map((i) => get("rotting-oranges").solve(i) === -1))).toEqual(new Set([true, false]));
  });
  it("tips quote true facts", () => {
    // Pacific Atlantic “a ridge”: the middle cell drains both ways, the corners (0,0) and (2,2) don't.
    const ridge = get("pacific-atlantic").solve([[1, 2, 1], [2, 3, 2], [1, 2, 1]]) as string;
    expect(ridge).toContain("[1,1]");
    expect(ridge).not.toContain("[0,0]");
    expect(ridge).not.toContain("[2,2]");
    // Surrounded Regions “two regions”: the top pair is captured, the right pair and the bottom O survive.
    expect(get("surrounded-regions").solve(["XXXXX", "XOOXX", "XXXOO", "XOXXX"])).toBe("[XXXXX, XXXXX, XXXOO, XOXXX]");
  });
});
