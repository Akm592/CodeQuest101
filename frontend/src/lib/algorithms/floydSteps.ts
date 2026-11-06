// Floyd's tortoise and hare: cycle detection (with cycle start) and middle node.
// Pure functions, tested in floydSteps.test.ts.

export type FloydMode = "cycle" | "middle";

export interface FloydStep {
  tortoise: number;
  /** null once the hare has run off the end of the list. */
  hare: number | null;
  phase: "start" | "move" | "meet" | "no-cycle" | "find-start" | "cycle-start" | "middle";
  log: string;
  /** Node where the pointers met, kept for the rest of the run. */
  met?: number;
  /** The answer: cycle start or middle node. */
  answer?: number;
}

export const MAX_NODES = 10;

export function nextOf(i: number, n: number, cycleTo: number | null): number | null {
  if (i < n - 1) return i + 1;
  return cycleTo;
}

export function buildFloydSteps(n: number, cycleTo: number | null, mode: FloydMode): FloydStep[] {
  const steps: FloydStep[] = [];
  const val = (i: number) => i + 1;
  const next = (i: number | null) => (i === null ? null : nextOf(i, n, cycleTo));
  let slow = 0;
  let fast: number | null = 0;
  steps.push({ tortoise: 0, hare: 0, phase: "start", log: "Both pointers start at the head." });

  if (mode === "middle") {
    while (fast !== null && next(fast) !== null) {
      slow = next(slow)!;
      fast = next(next(fast));
      steps.push({
        tortoise: slow,
        hare: fast,
        phase: "move",
        log: `Tortoise moves 1 to node ${val(slow)}. Hare moves 2 to ${fast === null ? "the end" : `node ${val(fast)}`}.`,
      });
    }
    steps.push({
      tortoise: slow,
      hare: fast,
      phase: "middle",
      answer: slow,
      log: `The hare can't move two more, so the tortoise is at the middle: node ${val(slow)}.`,
    });
    return steps;
  }

  // Phase 1: does the hare catch the tortoise, or fall off the end?
  for (;;) {
    if (fast === null || next(fast) === null) {
      steps.push({ tortoise: slow, hare: fast, phase: "no-cycle", log: "The hare reached the end, so there is no cycle." });
      return steps;
    }
    slow = next(slow)!;
    fast = next(next(fast));
    if (fast !== null && slow === fast) {
      steps.push({
        tortoise: slow,
        hare: fast,
        phase: "meet",
        met: slow,
        log: `They meet at node ${val(slow)}, so the list has a cycle.`,
      });
      break;
    }
    steps.push({
      tortoise: slow,
      hare: fast,
      phase: "move",
      log: `Tortoise moves 1 to node ${val(slow)}. Hare moves 2 to ${fast === null ? "the end" : `node ${val(fast)}`}.`,
    });
  }

  // Phase 2: tortoise back to the head; both move one step until they meet at
  // the cycle's start.
  const met = slow;
  slow = 0;
  steps.push({
    tortoise: slow,
    hare: fast,
    phase: "find-start",
    met,
    log: "To find where the cycle starts, move the tortoise back to the head. Now both move one step at a time.",
  });
  while (slow !== fast) {
    slow = next(slow)!;
    fast = next(fast)!;
    steps.push({ tortoise: slow, hare: fast, phase: "find-start", met, log: `Both move 1: tortoise at node ${val(slow)}, hare at node ${val(fast)}.` });
  }
  steps.push({ tortoise: slow, hare: fast, phase: "cycle-start", met, answer: slow, log: `They meet again at node ${val(slow)}: that is where the cycle starts.` });
  return steps;
}
