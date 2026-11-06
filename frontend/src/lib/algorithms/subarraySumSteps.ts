// Longest subarray with sum K by sliding window (non-negative input only).
// Pure functions, tested in subarraySumSteps.test.ts.

export interface WindowStep {
  /** Window is [left, right], inclusive. right = -1 before anything is added. */
  left: number;
  right: number;
  sum: number;
  action: "add" | "shrink" | "match" | "done";
  best: { start: number; end: number } | null;
  log: string;
}

export function buildSubarraySteps(arr: number[], k: number): WindowStep[] {
  const steps: WindowStep[] = [];
  let left = 0;
  let sum = 0;
  let best: WindowStep["best"] = null;

  for (let right = 0; right < arr.length; right++) {
    sum += arr[right];
    steps.push({ left, right, sum, action: "add", best, log: `Add ${arr[right]} at index ${right}. Sum is ${sum}.` });

    while (sum > k && left <= right) {
      const removed = arr[left];
      sum -= removed;
      left++;
      steps.push({
        left,
        right,
        sum,
        action: "shrink",
        best,
        log: `Sum is over ${k}, so drop ${removed} from the left. Sum is ${sum}.`,
      });
    }

    if (sum === k && left <= right) {
      const length = right - left + 1;
      const better = !best || length > best.end - best.start + 1;
      if (better) best = { start: left, end: right };
      steps.push({
        left,
        right,
        sum,
        action: "match",
        best,
        log: better
          ? `Sum equals ${k}. Length ${length} is the longest so far.`
          : `Sum equals ${k}, but length ${length} is not longer than the best.`,
      });
    }
  }

  steps.push({
    left,
    right: arr.length - 1,
    sum,
    action: "done",
    best,
    log: best
      ? `Done. The longest subarray is indices ${best.start} to ${best.end}, length ${best.end - best.start + 1}.`
      : `Done. No subarray adds up to ${k}.`,
  });
  return steps;
}

export function parseNonNegativeArray(text: string): number[] | string {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return "Enter at least one number.";
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return "The array can only contain numbers.";
  if (nums.some((n) => n < 0)) return "The sliding window only works for non-negative numbers.";
  if (nums.length > 30) return "Use at most 30 numbers so the array fits on screen.";
  return nums;
}
