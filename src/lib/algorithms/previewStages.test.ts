import { describe, expect, it } from "vitest";

import { frameDuration, loopDuration, loopNext, PREVIEW_DELAY_MS, PREVIEW_HOLD_MS } from "../../hooks/usePreviewLoop";
import {
  buildDpPreview,
  buildQueensPreview,
  buildTopoPreview,
  buildTriePreview,
  type PreviewDemo,
} from "./previewStages";
import { assertStepInvariants } from "./testHelpers";
import type { BaseStep } from "./types";

// Widened to BaseStep so the four demos can share one table of checks.
const demos: [string, PreviewDemo<BaseStep>][] = [
  ["dynamic programming", buildDpPreview() as unknown as PreviewDemo<BaseStep>],
  ["topological sort", buildTopoPreview() as unknown as PreviewDemo<BaseStep>],
  ["n-queens", buildQueensPreview() as unknown as PreviewDemo<BaseStep>],
  ["trie", buildTriePreview() as unknown as PreviewDemo<BaseStep>],
];

describe.each(demos)("%s preview", (_name, demo) => {
  const stageIds = demo.stages.map((s) => s.id);

  it("maps every step to a stage the card can name", () => {
    for (const [i, step] of demo.steps.entries()) {
      expect(stageIds, `step ${i} → "${demo.stageFor(step)}"`).toContain(demo.stageFor(step));
    }
  });

  // A stage that no step reaches is a label on the card that never lights up.
  it("reaches every stage at least once", () => {
    const reached = new Set(demo.steps.map(demo.stageFor));
    for (const id of stageIds) expect(reached, `stage "${id}" is never reached`).toContain(id);
  });

  it("ends on the final stage", () => {
    const last = demo.steps[demo.steps.length - 1];
    expect(demo.stageFor(last)).toBe(stageIds[stageIds.length - 1]);
  });

  it("is a complete run, not one cut short by the step cap", () => {
    assertStepInvariants(demo.steps);
  });

  // Long enough to show the idea, short enough that someone glancing at the
  // card sees the whole loop.
  it("loops in at most 25 seconds", () => {
    expect(loopDuration(demo.steps.length, PREVIEW_DELAY_MS, PREVIEW_HOLD_MS)).toBeLessThanOrEqual(25_000);
  });

  it("keeps every stage label short enough for one line on a phone", () => {
    for (const s of demo.stages) expect(s.label.length, s.label).toBeLessThanOrEqual(40);
  });
});

describe("preview starting stages", () => {
  it("starts each demo on its first stage", () => {
    for (const [name, demo] of demos) {
      expect(demo.stageFor(demo.steps[0]), name).toBe(demo.stages[0].id);
    }
  });
});

describe("preview loop timing", () => {
  it("advances and wraps", () => {
    expect(loopNext(0, 3)).toBe(1);
    expect(loopNext(1, 3)).toBe(2);
    expect(loopNext(2, 3)).toBe(0);
  });

  it("stays put on an empty or single-frame run", () => {
    expect(loopNext(0, 0)).toBe(0);
    expect(loopNext(0, 1)).toBe(0);
  });

  it("holds the final frame and no other", () => {
    expect(frameDuration(0, 3, 700, 1800)).toBe(700);
    expect(frameDuration(1, 3, 700, 1800)).toBe(700);
    expect(frameDuration(2, 3, 700, 1800)).toBe(1800);
  });

  it("counts one hold per loop", () => {
    expect(loopDuration(3, 700, 1800)).toBe(2 * 700 + 1800);
    expect(loopDuration(0, 700, 1800)).toBe(0);
  });
});
