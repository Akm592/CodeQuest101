import { describe, expect, it } from "vitest";

import type { PatternStep } from "../types";
import { LINKED_LIST } from "./index";

const get = (id: string) => LINKED_LIST.find((p) => p.id === id)!;
const inputs = (id: string) => [...get(id).examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => get(id).random(s + 1))];

/** Follows the drawn arrows from a node and returns the values seen. */
function follow(step: PatternStep, from: string): string[] {
  const links = step.links!;
  const next = new Map(links.edges.filter((e) => !e.dashed).map((e) => [e.from, e.to]));
  const val = new Map(links.nodes.map((n) => [n.id, n.v]));
  const out: string[] = [];
  const seen = new Set<string>();
  for (let id: string | undefined = from; id && !seen.has(id) && val.get(id) !== "∅"; id = next.get(id)) {
    seen.add(id);
    out.push(val.get(id)!);
  }
  return out;
}

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(get("reverse-list").solve([1, 2, 3, 4, 5])).toBe("[5, 4, 3, 2, 1]");
    expect(get("merge-two-lists").solve({ a: [1, 2, 4], b: [1, 3, 4] })).toBe("[1, 1, 2, 3, 4, 4]");
    expect(get("reorder-list").solve([1, 2, 3, 4, 5])).toBe("[1, 5, 2, 4, 3]");
    expect(get("reorder-list").solve([1, 2, 3, 4])).toBe("[1, 4, 2, 3]");
    expect(get("remove-nth").solve({ vals: [1, 2, 3, 4, 5], n: 2 })).toBe("[1, 2, 3, 5]");
    expect(get("add-two-numbers").solve({ a: [2, 4, 3], b: [5, 6, 4] })).toBe("[7, 0, 8]");
    expect(get("add-two-numbers").solve({ a: [9, 9, 9, 9, 9, 9, 9], b: [9, 9, 9, 9] })).toBe("[8, 9, 9, 9, 0, 0, 0, 1]");
    expect(get("linked-list-cycle").solve({ vals: [3, 2, 0, -4], pos: 1 })).toBe(true);
    expect(get("find-duplicate").solve([1, 3, 4, 2, 2])).toBe(2);
    expect(get("find-duplicate").solve([3, 1, 3, 4, 2])).toBe(3);
    expect(get("lru-cache").solve({ cap: 2, calls: ["put 1 1", "put 2 2", "get 1", "put 3 3", "get 2", "put 4 4", "get 1", "get 3", "get 4"] })).toBe("[1, -1, -1, 3, 4]");
    expect(get("merge-k-lists").solve([[1, 4, 5], [1, 3, 4], [2, 6]])).toBe("[1, 1, 2, 3, 4, 4, 5, 6]");
    expect(get("reverse-k-group").solve({ vals: [1, 2, 3, 4, 5], k: 2 })).toBe("[2, 1, 4, 3, 5]");
    expect(get("reverse-k-group").solve({ vals: [1, 2, 3, 4, 5], k: 3 })).toBe("[3, 2, 1, 4, 5]");
  });
});

describe("the animations", () => {
  it("every list answer shown matches the slow solution", () => {
    for (const p of LINKED_LIST) {
      for (const input of inputs(p.id)) {
        const want = p.solve(input);
        if (typeof want === "string") expect(p.run(input).at(-1)!.answer, `${p.title}: ${p.describe(input)}`).toBe(want);
      }
    }
  });
  it("following the drawn arrows on the last step spells out the answer", () => {
    const heads: Record<string, (input: never) => string> = {
      "reverse-list": (xs: number[]) => `n${xs.length - 1}`,
      "merge-two-lists": () => "d",
      "reorder-list": () => "n0",
      "remove-nth": () => "d",
      "reverse-k-group": () => "d",
    };
    for (const [id, head] of Object.entries(heads)) {
      const p = get(id);
      for (const input of inputs(id)) {
        const last = p.run(input).at(-1)!;
        let vals = follow(last, head(input as never));
        if (head(input as never) === "d") vals = vals.slice(1);
        expect(`[${vals.join(", ")}]`, `${p.title}: ${p.describe(input)}`).toBe(last.answer);
      }
    }
  });
  it("no node ever has two next arrows", () => {
    for (const p of LINKED_LIST) {
      for (const input of inputs(p.id).slice(0, 60)) {
        for (const st of p.run(input)) {
          if (!st.links) continue;
          const froms = st.links.edges.filter((e) => !e.dashed).map((e) => e.from);
          expect(new Set(froms).size, `${p.title}: ${st.explanation}`).toBe(froms.length);
        }
      }
    }
  });
  it("every arrow joins two drawn nodes", () => {
    for (const p of LINKED_LIST) {
      for (const input of inputs(p.id).slice(0, 60)) {
        for (const st of p.run(input)) {
          if (!st.links) continue;
          const ids = new Set(st.links.nodes.map((n) => n.id));
          for (const e of st.links.edges) expect(ids.has(e.from) && ids.has(e.to), `${p.title}: ${e.from}→${e.to}`).toBe(true);
        }
      }
    }
  });
  it("cycle and duplicate examples cover both answers", () => {
    expect(new Set(inputs("linked-list-cycle").map((i) => get("linked-list-cycle").solve(i)))).toEqual(new Set([true, false]));
  });
});
