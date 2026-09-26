import { describe, expect, it } from "vitest";

import { BEFORE_START, nextIndex } from "./useAlgorithmPlayer";

// Only the pure advance decision is tested here. Covering the hook itself would
// need jsdom, fake timers and a renderer — tripling the dependency footprint to
// exercise wiring that four visualizer routes already exercise for real.

describe("nextIndex", () => {
  it("advances out of the initial frame", () => {
    expect(nextIndex(BEFORE_START, 5)).toBe(0);
  });

  it("advances through the middle", () => {
    expect(nextIndex(0, 5)).toBe(1);
    expect(nextIndex(3, 5)).toBe(4);
  });

  it("stops on the last step", () => {
    expect(nextIndex(4, 5)).toBeNull();
  });

  it("never advances past the end, even from a bad index", () => {
    expect(nextIndex(9, 5)).toBeNull();
  });

  it("has nowhere to go with no steps", () => {
    expect(nextIndex(BEFORE_START, 0)).toBeNull();
    expect(nextIndex(0, 0)).toBeNull();
  });

  it("reaches every step exactly once from the initial frame", () => {
    const visited: number[] = [];
    let i: number | null = BEFORE_START;
    while ((i = nextIndex(i as number, 4)) !== null) visited.push(i);
    expect(visited).toEqual([0, 1, 2, 3]);
  });
});
