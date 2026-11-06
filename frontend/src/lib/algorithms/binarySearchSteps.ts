// Binary search over a sorted array. Pure functions, tested in binarySearchSteps.test.ts.

const ARRAY_SIZE = 15;
const MAX_VALUE = 99;
const MAX_LENGTH = 40;

export interface SearchStep {
  left: number;
  right: number;
  mid: number | null;
  outcome: "searching" | "found" | "not-found";
  log: string;
}

export function buildBinarySearchSteps(arr: number[], target: number): SearchStep[] {
  const steps: SearchStep[] = [];
  let l = 0;
  let r = arr.length - 1;
  steps.push({ left: l, right: r, mid: null, outcome: "searching", log: `Search the whole array: L = ${l}, R = ${r}.` });

  while (l <= r) {
    const m = Math.floor((l + r) / 2);
    if (arr[m] === target) {
      steps.push({ left: l, right: r, mid: m, outcome: "found", log: `arr[${m}] = ${arr[m]} is the target. Found at index ${m}.` });
      return steps;
    }
    const smaller = arr[m] < target;
    steps.push({
      left: l,
      right: r,
      mid: m,
      outcome: "searching",
      log: `M = ${m}. arr[${m}] = ${arr[m]} is ${smaller ? "smaller" : "larger"} than ${target}.`,
    });
    if (smaller) l = m + 1;
    else r = m - 1;
    steps.push({
      left: l,
      right: r,
      mid: null,
      outcome: "searching",
      log: smaller ? `Drop the left half: L = ${l}.` : `Drop the right half: R = ${r}.`,
    });
  }

  steps.push({ left: l, right: r, mid: null, outcome: "not-found", log: `L passed R, so ${target} is not in the array.` });
  return steps;
}

export function randomSortedArray(): number[] {
  const values = new Set<number>();
  while (values.size < ARRAY_SIZE) values.add(Math.floor(Math.random() * (MAX_VALUE + 1)));
  return [...values].sort((a, b) => a - b);
}

export function parseSortedArray(text: string): number[] | string {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return "Enter some numbers.";
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return "The array can only contain numbers.";
  const unique = [...new Set(nums)].sort((a, b) => a - b);
  if (unique.length > MAX_LENGTH) return `Use at most ${MAX_LENGTH} numbers.`;
  return unique;
}
