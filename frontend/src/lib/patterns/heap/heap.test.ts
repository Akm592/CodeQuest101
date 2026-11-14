import { describe, expect, it } from "vitest";

import { rngFor } from "../helpers";
import { Heap, heapNodes } from "./heap";
import { HEAP } from "./index";

const get = (id: string) => HEAP.find((p) => p.id === id)!;
const inputs = (id: string) => [...get(id).examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => get(id).random(s + 1))];

describe("the heap helper", () => {
  it("pops values in sorted order and keeps the heap property after every push and pop", () => {
    for (let s = 1; s <= 100; s++) {
      const g = rngFor(s);
      const vals = Array.from({ length: g.int(0, 30) }, () => g.int(-50, 50));
      for (const kind of ["min", "max"] as const) {
        const h = new Heap(kind);
        const ok = () => h.a.every((it, i) => i === 0 || (kind === "min" ? h.a[(i - 1) >> 1].key <= it.key : h.a[(i - 1) >> 1].key >= it.key));
        for (const v of vals) {
          h.push({ key: v });
          expect(ok()).toBe(true);
        }
        const out: number[] = [];
        while (h.size) {
          out.push(h.pop().top.key);
          expect(ok()).toBe(true);
        }
        expect(out).toEqual([...vals].sort((a, b) => (kind === "min" ? a - b : b - a)));
      }
    }
  });
  it("draws the tree from the array: index i's parent is (i − 1) / 2, one row up, and no two nodes share a spot", () => {
    const h = new Heap("min");
    for (let i = 0; i < 20; i++) h.push({ key: (i * 7) % 13 });
    const nodes = heapNodes(h);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    expect(new Set(nodes.map((n) => `${n.x},${n.depth}`)).size).toBe(nodes.length);
    for (const n of nodes) if (n.parent) expect(byId.get(n.parent)!.depth).toBe(n.depth - 1);
  });
});

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(get("kth-largest-stream").solve(get("kth-largest-stream").examples[0].input)).toBe("[4, 5, 5, 8, 8]");
    expect(get("last-stone-weight").solve([2, 7, 4, 1, 8, 1])).toBe(1);
    expect(get("k-closest").solve({ points: [[1, 3], [-2, 2]], k: 1 })).toBe("[(-2,2)]");
    expect(get("kth-largest-array").solve({ nums: [3, 2, 3, 1, 2, 4, 5, 5, 6], k: 4 })).toBe(4);
    expect(get("task-scheduler").solve({ tasks: "AAABBB", n: 2 })).toBe(8);
    expect(get("task-scheduler").solve({ tasks: "ACABDB", n: 1 })).toBe(6);
    expect(get("task-scheduler").solve({ tasks: "AAABBB", n: 3 })).toBe(10);
    expect(get("design-twitter").solve(get("design-twitter").examples[0].input)).toBe("[[5], [6, 5], [5]]");
    expect(get("find-median").solve(get("find-median").examples[0].input)).toBe("[1.5, 2]");
  });
  it("Task Scheduler matches the counting formula", () => {
    for (const { tasks, n } of inputs("task-scheduler")) {
      const counts = [...new Set(tasks)].map((t) => [...tasks].filter((c) => c === t).length);
      const most = Math.max(...counts);
      const formula = Math.max(tasks.length, (most - 1) * (n + 1) + counts.filter((c) => c === most).length);
      expect(get("task-scheduler").run({ tasks, n }).at(-1)!.answer, `${tasks}, n = ${n}`).toBe(String(formula));
    }
  });
});

describe("the animations", () => {
  it("the answer shown matches the slow solution", () => {
    for (const p of HEAP) for (const input of inputs(p.id)) expect(p.run(input).at(-1)!.answer, `${p.title}: ${p.describe(input)}`).toBe(String(p.solve(input)));
  });
  it("every heap drawn obeys the heap property (for the problems whose nodes show the key)", () => {
    // min or max, by problem; Find Median draws a max-heap (ids s…) beside a min-heap (ids l…).
    const kind: Record<string, (id: string) => "min" | "max"> = {
      "kth-largest-stream": () => "min",
      "kth-largest-array": () => "min",
      "last-stone-weight": () => "max",
      "find-median": (id) => (id.startsWith("s") ? "max" : "min"),
    };
    for (const [id, k] of Object.entries(kind))
      for (const input of inputs(id).slice(0, 80))
        for (const st of get(id).run(input)) {
          const byId = new Map(st.tree!.nodes.map((n) => [n.id, n]));
          for (const n of st.tree!.nodes) {
            if (!n.parent) continue;
            const par = byId.get(n.parent)!;
            expect(par.depth).toBe(n.depth - 1);
            const [a, b] = [Number(par.v), Number(n.v)];
            expect(k(n.id) === "min" ? a <= b : a >= b, `${id}: ${st.explanation}`).toBe(true);
          }
        }
  });
  it("Find Median: every number in small is at most every number in large, and the sizes differ by at most one", () => {
    for (const input of inputs("find-median"))
      for (const st of get("find-median").run(input)) {
        if (!["order", "balance", "median", "done"].includes(st.stage)) continue;
        const [small, large] = st.rows.slice(1).map((r) => r.cells.map((c) => Number(c.v)));
        // Between the order fix and the rebalance the sizes may briefly differ by 2.
        if (st.stage !== "order") expect(Math.abs(small.length - large.length)).toBeLessThanOrEqual(1);
        if (small.length && large.length) expect(Math.max(...small)).toBeLessThanOrEqual(Math.min(...large));
      }
  });
});
