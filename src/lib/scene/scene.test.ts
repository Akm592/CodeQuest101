import { describe, expect, it } from "vitest";

import bubbleSortFixture from "./fixtures/bubbleSort.json";
import twoSumFixture from "./fixtures/twoSum.json";
import { legacyToScene } from "./legacy";
import { parseScene, parseSuggestions } from "./validate";

const twoSum = () => ({
  title: "Two Sum",
  summary: "Look up each complement before storing the value.",
  structures: [
    { id: "nums", type: "array", label: "nums" },
    { id: "seen", type: "hashmap", label: "seen" },
    { id: "vars", type: "variables", label: "variables" },
  ],
  code: { language: "python", lines: ["seen = {}", "for i, x in enumerate(nums):", "    ..."] },
  steps: [
    {
      title: "Store 2",
      explanation: "9 - 2 = 7 is not stored yet, so remember 2 at index 0.",
      code_line: 2,
      states: [
        { structure: "nums", items: ["2", "7"] },
        { structure: "seen", entries: [{ key: "2", value: "0" }] },
      ],
      highlights: [{ structure: "nums", target: "0", role: "current" }],
      pointers: [{ name: "i", structure: "nums", target: "0" }],
      variables: [{ name: "target", value: "9" }],
    },
  ],
});

describe("parseScene", () => {
  it("accepts a well-formed scene", () => {
    const result = parseScene(twoSum());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.steps[0].pointers?.[0].name).toBe("i");
  });

  it("coerces numbers to strings rather than rejecting them", () => {
    const raw = twoSum();
    (raw.steps[0].states[0] as { items: unknown[] }).items = [2, 7];
    const result = parseScene(raw);
    expect(result.ok && result.value.steps[0].states[0].items).toEqual(["2", "7"]);
  });

  it.each([
    ["no steps", (s: ReturnType<typeof twoSum>) => { s.steps = []; }, /no steps/],
    ["an undrawable type", (s: ReturnType<typeof twoSum>) => { s.structures[0].type = "hologram"; }, /hologram/],
    ["an undeclared structure", (s: ReturnType<typeof twoSum>) => { s.steps[0].states[0].structure = "ghost"; }, /isn't declared/],
    ["a blank explanation", (s: ReturnType<typeof twoSum>) => { s.steps[0].explanation = " "; }, /no explanation/],
    ["a hash map without entries", (s: ReturnType<typeof twoSum>) => {
      s.steps[0].states[1] = { structure: "seen", items: ["2"] } as never;
    }, /no entries/],
  ])("rejects %s with a readable message", (_name, mutate, message) => {
    const raw = twoSum();
    mutate(raw);
    const result = parseScene(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(message);
  });

  it("rejects bars holding text, which used to draw NaN-height bars", () => {
    const result = parseScene({
      title: "Sort",
      structures: [{ id: "a", type: "bars", label: "a" }],
      steps: [{ title: "t", explanation: "e", states: [{ structure: "a", items: ["3", "x"] }] }],
    });
    expect(result.ok).toBe(false);
  });

  it("drops an out-of-range code line and junk highlights instead of failing", () => {
    const raw = twoSum();
    raw.steps[0].code_line = 40;
    raw.steps[0].highlights.push({ structure: "ghost", target: "0", role: "current" });
    const result = parseScene(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.steps[0].code_line).toBeUndefined();
      expect(result.value.steps[0].highlights).toHaveLength(1);
    }
  });
});

describe("parseSuggestions", () => {
  it("keeps well-formed trace suggestions, at most three", () => {
    const trace = { problem: "p", input: "i", approach: "a" };
    const raw = [
      { title: "A", kind: "trace", trace },
      { title: "", kind: "trace", trace },
      { title: "B", kind: "trace" },
      { title: "C", kind: "builtin", builtin: { key: "x" } },
      ...["D", "E", "F"].map((title) => ({ title, kind: "trace", trace })),
    ];
    expect(parseSuggestions(raw).map((s) => s.title)).toEqual(["A", "D", "E"]);
  });

  it("returns nothing for junk", () => {
    expect(parseSuggestions(null)).toEqual([]);
    expect(parseSuggestions({ title: "x" })).toEqual([]);
  });
});

describe("legacyToScene", () => {
  it("turns an old sorting payload into bars with compare and swap highlights", () => {
    const scene = legacyToScene({
      visualizationType: "sorting",
      algorithm: "bubble_sort",
      array: [3, 1, 2],
      steps: [
        { array: [3, 1, 2], compare: [0, 1], message: "Compare 3 and 1" },
        { array: [1, 3, 2], swap: [0, 1], message: "Swap them" },
      ],
    });
    expect(scene?.structures[0].type).toBe("bars");
    expect(scene?.title).toBe("bubble sort");
    expect(scene?.steps[1].states[0].items).toEqual(["1", "3", "2"]);
    expect(scene?.steps[1].highlights).toEqual([
      { structure: "data", target: "0", role: "swap" },
      { structure: "data", target: "1", role: "swap" },
    ]);
    expect(parseScene(scene).ok).toBe(true);
  });

  it("carries the previous array forward when a step omits it", () => {
    const scene = legacyToScene({
      visualizationType: "array",
      array: ["a", "b"],
      steps: [{ message: "start", pointers: { left: 0, right: 1 } }],
    });
    expect(scene?.steps[0].states[0].items).toEqual(["a", "b"]);
    expect(scene?.steps[0].pointers).toEqual([
      { name: "left", structure: "data", target: "0" },
      { name: "right", structure: "data", target: "1" },
    ]);
  });

  it("orders a linked list by following next pointers", () => {
    const scene = legacyToScene({
      visualizationType: "linked_list",
      nodes: [
        { id: "b", value: 2, next: "c" },
        { id: "a", value: 1, next: "b" },
        { id: "c", value: 3, next: null },
      ],
      steps: [{ message: "at b", highlightedNodes: ["b"] }],
    });
    expect(scene?.steps[0].states[0].items).toEqual(["1", "2", "3"]);
    expect(scene?.steps[0].highlights?.[0].target).toBe("1");
  });

  it("converts an object hash map", () => {
    const scene = legacyToScene({
      visualizationType: "hashmap",
      hashmap: {},
      steps: [{ hashmap: { a: 1 }, message: "insert a" }],
    });
    expect(scene?.steps[0].states[0].entries).toEqual([{ key: "a", value: "1" }]);
  });

  it("leaves graphs and trees to the old renderer", () => {
    expect(legacyToScene({ visualizationType: "graph", nodes: [], edges: [], steps: [{}] })).toBeNull();
    expect(legacyToScene({ visualizationType: "tree", nodes: [], steps: [{}] })).toBeNull();
    expect(legacyToScene(null)).toBeNull();
  });
});

describe("fixture scenes", () => {
  // The same files are validated by the backend's Pydantic model, which keeps
  // the two sides of the wire format honest with each other.
  it.each([
    ["two sum", twoSumFixture],
    ["bubble sort", bubbleSortFixture],
  ])("%s parses", (_name, fixture) => {
    const result = parseScene(fixture);
    expect(result.ok, result.ok ? "" : result.error).toBe(true);
  });
});
