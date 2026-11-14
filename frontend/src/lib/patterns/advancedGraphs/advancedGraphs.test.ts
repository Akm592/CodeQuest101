import { describe, expect, it } from "vitest";

import { ADVANCED_GRAPHS } from "./index";

const get = (id: string) => ADVANCED_GRAPHS.find((p) => p.id === id)!;
const inputs = (id: string) => [...get(id).examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => get(id).random(s + 1))];

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(get("reconstruct-itinerary").solve(get("reconstruct-itinerary").examples[0].input)).toBe("[JFK, ATL, JFK, SFO, ATL, SFO]");
    expect(get("reconstruct-itinerary").solve([["MUC", "LHR"], ["JFK", "MUC"], ["SFO", "SJC"], ["LHR", "SFO"]])).toBe("[JFK, MUC, LHR, SFO, SJC]");
    expect(get("reconstruct-itinerary").solve([["JFK", "KUL"], ["JFK", "NRT"], ["NRT", "JFK"]])).toBe("[JFK, NRT, JFK, KUL]");
    expect(get("min-cost-connect").solve([[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]])).toBe(20);
    expect(get("min-cost-connect").solve([[3, 12], [-2, 5], [-4, 1]])).toBe(18);
    expect(get("network-delay").solve({ times: [[2, 1, 1], [2, 3, 1], [3, 4, 1]], n: 4, k: 2 })).toBe(2);
    expect(get("network-delay").solve({ times: [[1, 2, 1]], n: 2, k: 2 })).toBe(-1);
    expect(get("swim-rising-water").solve([[0, 2], [1, 3]])).toBe(3);
    expect(get("swim-rising-water").solve(get("swim-rising-water").examples[0].input)).toBe(16);
    expect(get("alien-dictionary").run(["wrt", "wrf", "er", "ett", "rftt"]).at(-1)!.answer).toBe('"wertf"');
    expect(get("alien-dictionary").solve(["z", "x", "z"])).toBe('""');
    expect(get("alien-dictionary").solve(["abc", "ab"])).toBe('""');
    expect(get("cheapest-flights").solve(get("cheapest-flights").examples[0].input)).toBe(700);
    expect(get("cheapest-flights").solve({ n: 3, flights: [[0, 1, 100], [1, 2, 100], [0, 2, 500]], src: 0, dst: 2, k: 1 })).toBe(200);
    expect(get("cheapest-flights").solve({ n: 3, flights: [[0, 1, 100], [1, 2, 100], [0, 2, 500]], src: 0, dst: 2, k: 0 })).toBe(500);
  });
});

describe("the animations", () => {
  it("the answer shown matches the slow or cross-check solution", () => {
    for (const p of ADVANCED_GRAPHS)
      for (const input of inputs(p.id)) {
        const shown = p.run(input).at(-1)!.answer;
        const want = String(p.solve(input));
        expect(p.canon ? p.canon(shown) : shown, `${p.title}: ${p.describe(input)}`).toBe(p.canon ? p.canon(want) : want);
      }
  });
  it("Alien Dictionary's alphabet obeys every rule from neighbouring words", () => {
    for (const words of inputs("alien-dictionary")) {
      const ans = get("alien-dictionary").run(words).at(-1)!.answer!.slice(1, -1);
      if (!ans) continue;
      for (let i = 0; i + 1 < words.length; i++) {
        const [a, b] = [words[i], words[i + 1]];
        const j = [...a].findIndex((c: string, k: number) => c !== b[k]);
        if (j >= 0 && j < b.length) expect(ans.indexOf(a[j]), `${ans}: ${a} before ${b}`).toBeLessThan(ans.indexOf(b[j]));
      }
    }
  });
  it("Reconstruct Itinerary uses every ticket exactly once, starting at JFK", () => {
    for (const t of inputs("reconstruct-itinerary")) {
      const trip = get("reconstruct-itinerary").run(t).at(-1)!.answer!.slice(1, -1).split(", ");
      expect(trip[0]).toBe("JFK");
      const legs = trip.slice(1).map((b: string, i: number) => `${trip[i]}>${b}`).sort();
      expect(legs).toEqual(t.map(([a, b]: string[]) => `${a}>${b}`).sort());
    }
  });
  it("graph pictures: every edge joins two drawn nodes", () => {
    for (const p of ADVANCED_GRAPHS)
      for (const input of inputs(p.id).slice(0, 60))
        for (const st of p.run(input)) {
          if (!st.graph) continue;
          const ids = new Set(st.graph.nodes.map((n) => n.id));
          for (const e of st.graph.edges) expect(ids.has(e.a) && ids.has(e.b), `${p.title}: ${e.a}–${e.b}`).toBe(true);
        }
  });
  it("random inputs cover reachable and unreachable answers", () => {
    for (const id of ["network-delay", "cheapest-flights"]) expect(new Set(inputs(id).map((i) => get(id).solve(i) === -1)), id).toEqual(new Set([true, false]));
    expect(new Set(inputs("alien-dictionary").map((i) => get("alien-dictionary").solve(i) === '""'))).toEqual(new Set([true, false]));
  });
});
