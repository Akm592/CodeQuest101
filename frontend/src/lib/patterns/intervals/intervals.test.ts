import { describe, expect, it } from "vitest";

import { INTERVALS } from "./index";

const get = (id: string) => INTERVALS.find((p) => p.id === id)!;
const inputs = (id: string) => [...get(id).examples.map((e) => e.input), ...Array.from({ length: 300 }, (_, s) => get(id).random(s + 1))];

describe("worked examples match the known answers", () => {
  it("each problem", () => {
    expect(get("insert-interval").solve({ intervals: [[1, 3], [6, 9]], add: [2, 5] })).toBe("[[1,5], [6,9]]");
    expect(get("insert-interval").solve(get("insert-interval").examples[0].input)).toBe("[[1,2], [3,10], [12,16]]");
    expect(get("merge-intervals").solve([[1, 3], [2, 6], [8, 10], [15, 18]])).toBe("[[1,6], [8,10], [15,18]]");
    expect(get("merge-intervals").solve([[1, 4], [4, 5]])).toBe("[[1,5]]");
    expect(get("non-overlapping").solve([[1, 2], [2, 3], [3, 4], [1, 3]])).toBe(1);
    expect(get("non-overlapping").solve([[1, 2], [1, 2], [1, 2]])).toBe(2);
    expect(get("non-overlapping").solve([[1, 10], [2, 3], [4, 5], [6, 7]])).toBe(1);
    expect(get("meeting-rooms").solve([[0, 30], [5, 10], [15, 20]])).toBe(false);
    expect(get("meeting-rooms").solve([[1, 3], [3, 5], [5, 6]])).toBe(true);
    expect(get("meeting-rooms-ii").solve([[0, 30], [5, 10], [15, 20]])).toBe(2);
    expect(get("meeting-rooms-ii").solve([[1, 5], [2, 6], [3, 7], [6, 8]])).toBe(3);
    expect(get("meeting-rooms-ii").solve([[1, 3], [3, 5]])).toBe(1);
    expect(get("min-interval-query").solve(get("min-interval-query").examples[0].input)).toBe("[3, 3, 1, 4]");
    expect(get("min-interval-query").solve(get("min-interval-query").examples[1].input)).toBe("[2, -1, 4, 6]");
  });
});

describe("the animations", () => {
  it("the answer shown matches the slow solution", () => {
    for (const p of INTERVALS) for (const input of inputs(p.id)) expect(p.run(input).at(-1)!.answer, `${p.title}: ${p.describe(input)}`).toBe(String(p.solve(input)));
  });
  it("timelines: every bar has start ≤ end and sits on a labelled lane", () => {
    for (const p of INTERVALS)
      for (const input of inputs(p.id).slice(0, 60))
        for (const st of p.run(input)) {
          const t = st.timeline!;
          for (const b of t.bars) {
            expect(b.start).toBeLessThanOrEqual(b.end);
            expect(b.lane).toBeLessThan(t.lanes!.length);
          }
        }
  });
  it("random inputs cover both answers for Meeting Rooms", () => {
    expect(new Set(inputs("meeting-rooms").map((i) => get("meeting-rooms").solve(i)))).toEqual(new Set([true, false]));
  });
});
