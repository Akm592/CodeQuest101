// What every algorithm step generator in this folder agrees on.
//
// Generators are pure: `(input) => Step[]`. Nothing in here imports React, so
// the algorithms can be tested for correctness without rendering anything —
// which is the point. Before this the repo could not assert that its own
// Dijkstra returned a correct distance.
//
// Two rules the generators must honour, both enforced by `assertStepInvariants`
// in the test helper:
//
//  1. Snapshots are immutable. Each step carries its own copy of whatever the
//     renderer draws. Pushing the same mutable array or Map into every step is
//     the failure mode of this architecture: playback looks perfect going
//     forwards and every frame is identical going backwards.
//  2. Generation is bounded. A visualizer builds steps eagerly during render,
//     so an unbounded generator hangs the page rather than the algorithm.

/** Row/column position in a grid, board or table. */
export interface Cell {
  row: number;
  col: number;
}

/** The fields every step in this folder carries. */
export interface BaseStep {
  /** One sentence, shown under the canvas. Never empty. */
  explanation: string;
  /** True on the last step of a completed run. */
  done?: boolean;
  /** True when generation stopped at the cap rather than at the answer. */
  truncated?: boolean;
}

export const DEFAULT_MAX_STEPS = 5000;

export interface GeneratorOptions {
  maxSteps?: number;
}

/**
 * Collects steps and stops at a cap.
 *
 * Generators build eagerly during a component's render, so "the user pasted a
 * 40-character string into Edit Distance" has to end in a terminal step rather
 * than a frozen tab.
 */
export class StepBuilder<TStep extends BaseStep> {
  private readonly steps: TStep[] = [];
  private readonly maxSteps: number;
  private capped = false;

  constructor(options: GeneratorOptions = {}) {
    this.maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
  }

  /** @returns false once the cap is reached, so a generator can stop early. */
  push(step: TStep): boolean {
    if (this.capped) return false;
    if (this.steps.length >= this.maxSteps) {
      this.capped = true;
      return false;
    }
    this.steps.push(step);
    return true;
  }

  get isFull(): boolean {
    return this.capped || this.steps.length >= this.maxSteps;
  }

  /**
   * Closes the run. `finalStep` is appended when there is room; when the cap
   * was hit, the last step is marked `truncated` instead so the UI can say so.
   */
  finish(finalStep?: TStep): TStep[] {
    if (finalStep && !this.capped && this.steps.length < this.maxSteps) {
      this.steps.push(finalStep);
    } else if (this.steps.length > 0) {
      const last = this.steps[this.steps.length - 1];
      this.steps[this.steps.length - 1] = {
        ...last,
        truncated: true,
        done: true,
        explanation: `${last.explanation} (stopped at ${this.maxSteps} steps — try a smaller input)`,
      };
    }
    return this.steps;
  }
}
