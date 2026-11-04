// Invariants every step generator in this folder must satisfy.
//
// The important one is snapshot aliasing. If a generator pushes the same
// mutable grid/array/Map into every step instead of a copy, playback looks
// perfect going forwards — each frame is re-read from the same object, which by
// then holds the final state — and every frame is identical going backwards.
// Nothing about the animation reveals it. This helper mutation-proofs the run
// by checking early snapshots still differ from late ones.
//
// Named .ts rather than .test.ts so vitest does not treat it as a suite.

import { expect } from "vitest";

import type { BaseStep } from "./types";

export interface InvariantOptions<TStep extends BaseStep> {
  /** Pull the mutable state a step snapshots, for aliasing checks. */
  snapshot?: (step: TStep) => unknown;
  /** Expect the run to finish rather than hit the cap. */
  expectComplete?: boolean;
}

export function assertStepInvariants<TStep extends BaseStep>(
  steps: TStep[],
  options: InvariantOptions<TStep> = {},
): void {
  const { snapshot, expectComplete = true } = options;

  expect(steps.length).toBeGreaterThan(0);

  for (const [i, step] of steps.entries()) {
    expect(step.explanation, `step ${i} has no explanation`).toBeTruthy();
    expect(step.explanation.trim().length, `step ${i} explanation is blank`).toBeGreaterThan(0);
  }

  const last = steps[steps.length - 1];
  expect(last.done, "last step is not marked done").toBe(true);

  if (expectComplete) {
    expect(last.truncated, "run hit the step cap").toBeFalsy();
  }

  if (snapshot && steps.length > 2) {
    // Every snapshot must be a distinct object...
    const seen = new Set<unknown>();
    for (const [i, step] of steps.entries()) {
      const snap = snapshot(step);
      expect(seen.has(snap), `step ${i} reuses an earlier snapshot object`).toBe(false);
      seen.add(snap);
    }

    // ...and the run must contain more than one distinct state. Distinct
    // objects all holding identical data means the generator copied and then
    // wrote through to the original anyway.
    //
    // Deliberately not "first differs from last": an exhaustive backtracking
    // search correctly unwinds to the empty board it started from, so those two
    // frames match in a perfectly healthy run.
    const distinct = new Set(steps.map((s) => JSON.stringify(snapshot(s))));
    expect(
      distinct.size,
      "every snapshot holds identical data — is the generator sharing one mutable object?",
    ).toBeGreaterThan(1);
  }
}
