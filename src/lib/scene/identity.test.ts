import { describe, expect, it } from "vitest";

import { assignIds, idsForSteps } from "./identity";

const counter = () => {
  let n = 0;
  return () => `new${n++}`;
};

describe("assignIds", () => {
  it("gives a swap's two items each other's positions, so they slide past each other", () => {
    expect(assignIds(["3", "1"], ["a", "b"], ["1", "3"], counter())).toEqual(["b", "a"]);
  });

  it("keeps existing ids on a push and mints one for the new item", () => {
    expect(assignIds(["1", "2"], ["a", "b"], ["1", "2", "3"], counter())).toEqual(["a", "b", "new0"]);
  });

  it("shifts ids left on a dequeue rather than repainting every box", () => {
    expect(assignIds(["1", "2", "3"], ["a", "b", "c"], ["2", "3"], counter())).toEqual(["b", "c"]);
  });

  it("prefers the same position among equal values", () => {
    expect(assignIds(["5", "5", "5"], ["a", "b", "c"], ["5", "5", "5"], counter())).toEqual(["a", "b", "c"]);
  });

  it("never hands the same id to two items", () => {
    const ids = assignIds(["1", "1"], ["a", "b"], ["1", "1", "1"], counter());
    expect(new Set(ids).size).toBe(3);
  });

  it("treats a changed value in place as a new item", () => {
    expect(assignIds(["1", "2"], ["a", "b"], ["1", "9"], counter())).toEqual(["a", "new0"]);
  });
});

describe("idsForSteps", () => {
  it("threads identities through a whole run, and is deterministic", () => {
    const steps = [["3", "1", "2"], ["1", "3", "2"], ["1", "2", "3"]];
    const a = idsForSteps(steps);
    expect(a).toEqual(idsForSteps(steps));
    // The 3 travels from index 0 to index 2 under one identity.
    expect(a[0][0]).toBe(a[1][1]);
    expect(a[1][1]).toBe(a[2][2]);
  });

  it("leaves a gap for steps without items", () => {
    expect(idsForSteps([["1"], null, ["1"]])).toEqual([["i0"], [], ["i0"]]);
  });
});
