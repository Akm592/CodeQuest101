// Stable identities for the items of a structure across steps.
//
// A scene step only says what a structure *contains*: [3, 1] then [1, 3]. To
// animate that as a swap, or [1, 2] -> [1, 2, 3] as a push, the renderer needs
// to know which element is which, so it can key it and let the layout animation
// slide it from its old position to its new one. Keyed by index, a swap just
// repaints two boxes in place, which is the "every animation looks the same"
// problem.
//
// Matching is by value: an item keeps the identity of an equal item from the
// previous step, preferring the same position, then the nearest one. Equal
// values are interchangeable on screen anyway, so the guess can't look wrong.

export function assignIds(
  prevItems: readonly string[] | null,
  prevIds: readonly string[] | null,
  items: readonly string[],
  newId: () => string,
): string[] {
  if (!prevItems || !prevIds) return items.map(() => newId());

  const used = new Set<number>();
  const ids: (string | null)[] = items.map(() => null);

  // Pass 1: unchanged positions keep their id.
  items.forEach((item, i) => {
    if (i < prevItems.length && prevItems[i] === item) {
      ids[i] = prevIds[i];
      used.add(i);
    }
  });

  // Pass 2: everything else takes the nearest unused equal value.
  items.forEach((item, i) => {
    if (ids[i] !== null) return;
    let best = -1;
    for (let j = 0; j < prevItems.length; j++) {
      if (used.has(j) || prevItems[j] !== item) continue;
      if (best === -1 || Math.abs(j - i) < Math.abs(best - i)) best = j;
    }
    if (best !== -1) {
      ids[i] = prevIds[best];
      used.add(best);
    }
  });

  return ids.map((id) => id ?? newId());
}

/**
 * Ids for every step of one structure, computed once per scene so stepping
 * backwards reuses exactly the ids stepping forwards produced.
 */
export function idsForSteps(itemsPerStep: readonly (readonly string[] | null)[]): string[][] {
  let counter = 0;
  const newId = () => `i${counter++}`;
  const out: string[][] = [];
  let prevItems: readonly string[] | null = null;
  let prevIds: string[] | null = null;
  for (const items of itemsPerStep) {
    if (!items) {
      out.push([]);
      continue;
    }
    const ids = assignIds(prevItems, prevIds, items, newId);
    out.push(ids);
    prevItems = items;
    prevIds = ids;
  }
  return out;
}
