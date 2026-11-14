// Small helpers shared by the Backtracking problems.

/** Compares two lists element by element, then by length. */
export function lexCmp<T extends string | number>(a: readonly T[], b: readonly T[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  return a.length - b.length;
}

/** A list of lists in one fixed order, so any valid answer prints the same way. */
export function canonLists<T extends string | number>(lists: readonly (readonly T[])[], sortInner: boolean): T[][] {
  const inner = lists.map((l) => (sortInner ? [...l].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0)) : [...l]));
  return inner.sort(lexCmp);
}

export const showList = (l: readonly (string | number)[]) => `[${l.join(", ")}]`;
export const showLists = (ls: readonly (readonly (string | number)[])[]) => `[${ls.map(showList).join(", ")}]`;
