// Bubble, selection, quick and merge sort, recorded as steps.
// Pure functions, tested in sortSteps.test.ts.

export type Algo = "bubble" | "selection" | "quick" | "merge";
export type Mark = "compare" | "swap" | "pivot" | "min";

export interface SortStep {
  arr: number[];
  marks: Partial<Record<number, Mark>>;
  sorted: number[];
  log: string;
}

export const ARRAY_SIZE = 20;
export const MAX_VALUE = 99;
export const MAX_LENGTH = 40;

export const ALGO_INFO: Record<Algo, { title: string; description: string; complexity: { time: string; space: string }; pseudocode: string }> = {
  bubble: {
    title: "Bubble Sort",
    description:
      "Walk the array comparing neighbours and swap any pair that is out of order. After each pass the largest remaining value has bubbled to the end.",
    complexity: { time: "O(n²)", space: "O(1)" },
    pseudocode: `for i from 0 to n-2:
    swapped = false
    for j from 0 to n-i-2:
        if arr[j] > arr[j+1]:
            swap(arr[j], arr[j+1])
            swapped = true
    if not swapped: break`,
  },
  selection: {
    title: "Selection Sort",
    description:
      "Find the smallest value in the unsorted part and swap it to the front of that part. The sorted prefix grows by one each pass.",
    complexity: { time: "O(n²)", space: "O(1)" },
    pseudocode: `for i from 0 to n-2:
    min = i
    for j from i+1 to n-1:
        if arr[j] < arr[min]:
            min = j
    swap(arr[i], arr[min])`,
  },
  quick: {
    title: "Quick Sort",
    description:
      "Pick a pivot (here the last value), move everything smaller to its left, and put the pivot in its final place. Then sort each side the same way.",
    complexity: { time: "O(n log n) average", space: "O(log n)" },
    pseudocode: `quickSort(arr, lo, hi):
    if lo < hi:
        p = partition(arr, lo, hi)
        quickSort(arr, lo, p - 1)
        quickSort(arr, p + 1, hi)

partition(arr, lo, hi):
    pivot = arr[hi]; i = lo
    for j from lo to hi-1:
        if arr[j] < pivot:
            swap(arr[i], arr[j]); i++
    swap(arr[i], arr[hi])
    return i`,
  },
  merge: {
    title: "Merge Sort",
    description:
      "Split the array in half, sort each half, then merge the two sorted halves by repeatedly taking the smaller front value. Stable, and always O(n log n).",
    complexity: { time: "O(n log n)", space: "O(n)" },
    pseudocode: `mergeSort(arr, l, r):
    if l < r:
        m = (l + r) / 2
        mergeSort(arr, l, m)
        mergeSort(arr, m + 1, r)
        merge(arr, l, m, r)`,
  },
};

export function buildSortSteps(input: number[], algo: Algo): SortStep[] {
  const arr = [...input];
  const n = arr.length;
  const sorted = new Set<number>();
  const steps: SortStep[] = [];
  const push = (marks: SortStep["marks"], log: string) =>
    steps.push({ arr: [...arr], marks, sorted: [...sorted], log });
  const swap = (i: number, j: number) => {
    [arr[i], arr[j]] = [arr[j], arr[i]];
  };

  if (algo === "bubble") {
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        push({ [j]: "compare", [j + 1]: "compare" }, `Compare ${arr[j]} and ${arr[j + 1]}.`);
        if (arr[j] > arr[j + 1]) {
          swap(j, j + 1);
          swapped = true;
          push({ [j]: "swap", [j + 1]: "swap" }, `${arr[j + 1]} > ${arr[j]}, so swap them.`);
        }
      }
      sorted.add(n - 1 - i);
      if (!swapped) {
        for (let k = 0; k < n; k++) sorted.add(k);
        push({}, "No swaps in this pass, so the array is sorted.");
        break;
      }
    }
  } else if (algo === "selection") {
    for (let i = 0; i < n - 1; i++) {
      let min = i;
      for (let j = i + 1; j < n; j++) {
        push({ [min]: "min", [j]: "compare" }, `Smallest so far is ${arr[min]}. Check ${arr[j]}.`);
        if (arr[j] < arr[min]) min = j;
      }
      if (min !== i) {
        swap(i, min);
        push({ [i]: "swap", [min]: "swap" }, `Move ${arr[i]} to position ${i}.`);
      }
      sorted.add(i);
    }
  } else if (algo === "quick") {
    const sort = (lo: number, hi: number) => {
      if (lo > hi) return;
      if (lo === hi) {
        sorted.add(lo);
        return;
      }
      const pivot = arr[hi];
      let i = lo;
      push({ [hi]: "pivot" }, `Partition ${lo}–${hi} around pivot ${pivot}.`);
      for (let j = lo; j < hi; j++) {
        push({ [hi]: "pivot", [j]: "compare" }, `Is ${arr[j]} < ${pivot}?`);
        if (arr[j] < pivot) {
          if (i !== j) {
            swap(i, j);
            push({ [hi]: "pivot", [i]: "swap", [j]: "swap" }, `Yes: move ${arr[i]} to the left side.`);
          }
          i++;
        }
      }
      swap(i, hi);
      sorted.add(i);
      push({ [i]: "swap" }, `Pivot ${pivot} goes to its final place, index ${i}.`);
      sort(lo, i - 1);
      sort(i + 1, hi);
    };
    sort(0, n - 1);
  } else {
    const merge = (l: number, m: number, r: number) => {
      const left = arr.slice(l, m + 1);
      const right = arr.slice(m + 1, r + 1);
      let i = 0;
      let j = 0;
      // Collect into `out` and write back once, so every frame shown while
      // comparing is still a permutation of the input.
      const out: number[] = [];
      while (i < left.length && j < right.length) {
        push({ [l + i]: "compare", [m + 1 + j]: "compare" }, `Merge ${l}–${r}: take the smaller of ${left[i]} and ${right[j]}.`);
        out.push(left[i] <= right[j] ? left[i++] : right[j++]);
      }
      while (i < left.length) out.push(left[i++]);
      while (j < right.length) out.push(right[j++]);
      out.forEach((v, x) => (arr[l + x] = v));
      const marks: SortStep["marks"] = {};
      for (let x = l; x <= r; x++) marks[x] = "swap";
      if (l === 0 && r === n - 1) for (let x = 0; x < n; x++) sorted.add(x);
      push(marks, `Positions ${l}–${r} are now merged in order.`);
    };
    const sort = (l: number, r: number) => {
      if (l >= r) return;
      const m = Math.floor((l + r) / 2);
      sort(l, m);
      sort(m + 1, r);
      merge(l, m, r);
    };
    sort(0, n - 1);
  }

  for (let k = 0; k < n; k++) sorted.add(k);
  push({}, "Sorted.");
  return steps;
}

export function randomArray(size = ARRAY_SIZE): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * MAX_VALUE) + 1);
}

export function parseSortArray(text: string): number[] | string {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (parts.length < 2) return "Enter at least two numbers.";
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return "Use non-negative numbers only.";
  if (nums.length > MAX_LENGTH) return `Use at most ${MAX_LENGTH} numbers.`;
  return nums;
}
