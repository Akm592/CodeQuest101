// Old saved visualizations, converted to scenes.
//
// Before scenes, the backend stored one payload per visualization:
// `{visualizationType, steps: [{message, ...type-specific fields}]}`, drawn by
// the p5 canvas in AlgorithmVisualizer. Conversations saved then still hold
// those, so this turns the types the new player can draw into scenes. Graphs
// and trees return null and keep opening in the old renderer for now.

import type { Highlight, Pointer, Scene, SceneStep, StructureSpec, StructureState } from "./types";

type Raw = Record<string, unknown>;

const isObject = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown): string =>
  v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
const items = (v: unknown): string[] | null => (Array.isArray(v) ? v.map(text) : null);
const indices = (v: unknown): number[] =>
  Array.isArray(v) ? v.filter((x): x is number => typeof x === "number" && Number.isInteger(x)) : [];

function message(step: Raw, n: number): string {
  const m = text(step.message ?? step.description ?? step.explanation).trim();
  return m || `Step ${n}`;
}

function hashmapEntries(v: unknown): { key: string; value: string }[] | null {
  if (Array.isArray(v)) {
    return v.map((e) =>
      Array.isArray(e) ? { key: text(e[0]), value: text(e[1]) } : isObject(e) ? { key: text(e.key), value: text(e.value) } : { key: text(e), value: "" },
    );
  }
  if (isObject(v)) return Object.entries(v).map(([key, value]) => ({ key, value: text(value) }));
  return null;
}

function cells(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((c) => (Array.isArray(c) ? `${c[0]},${c[1]}` : isObject(c) ? `${c.row},${c.col}` : null))
    .filter((c): c is string => c !== null);
}

/** Node values in list order, following `next` from the node nothing points to. */
function linkedOrder(nodes: unknown): { ids: string[]; values: string[] } | null {
  if (!Array.isArray(nodes)) return null;
  const byId = new Map<string, Raw>();
  for (const n of nodes) if (isObject(n)) byId.set(text(n.id), n);
  const pointedAt = new Set([...byId.values()].map((n) => text(n.next)).filter(Boolean));
  let current = [...byId.keys()].find((id) => !pointedAt.has(id));
  const ids: string[] = [];
  while (current !== undefined && byId.has(current) && !ids.includes(current)) {
    ids.push(current);
    const next = byId.get(current)?.next;
    current = next === null || next === undefined ? undefined : text(next);
  }
  if (ids.length === 0) return null;
  return { ids, values: ids.map((id) => text(byId.get(id)?.value)) };
}

export function legacyToScene(raw: unknown): Scene | null {
  if (!isObject(raw) || !Array.isArray(raw.steps) || raw.steps.length === 0) return null;
  const kind = text(raw.visualizationType).trim().toLowerCase();
  const rawSteps = raw.steps.filter(isObject);
  const title = text(raw.algorithm || raw.title || kind).replace(/_/g, " ") || "Visualization";

  const build = (spec: StructureSpec, stepFor: (s: Raw, prev: StructureState | null) => {
    state: StructureState;
    highlights?: Highlight[];
    pointers?: Pointer[];
  } | null): Scene | null => {
    const steps: SceneStep[] = [];
    let prev: StructureState | null = null;
    for (const [i, s] of rawSteps.entries()) {
      const out = stepFor(s, prev);
      if (!out) return null;
      prev = out.state;
      steps.push({
        title: `Step ${i + 1}`,
        explanation: message(s, i + 1),
        states: [out.state],
        highlights: out.highlights ?? [],
        pointers: out.pointers ?? [],
        variables: [],
      });
    }
    return { title, summary: "", structures: [spec], steps };
  };

  const id = "data";
  const mark = (target: number | string, role: Highlight["role"]): Highlight => ({
    structure: id,
    target: String(target),
    role,
  });

  switch (kind) {
    case "sorting":
    case "array": {
      const bars = kind === "sorting";
      const base = items(raw.array);
      return build({ id, type: bars ? "bars" : "array", label: bars ? "array" : "array" }, (s, prev) => {
        const values = items(s.array) ?? prev?.items ?? base;
        if (!values) return null;
        if (bars && values.some((v) => !Number.isFinite(Number(v)))) return null;
        const highlights: Highlight[] = [
          ...indices(s.compare).map((i) => mark(i, "compare")),
          ...indices(s.swap).map((i) => mark(i, "swap")),
          ...indices(s.highlightedIndices).map((i) => mark(i, "current")),
        ];
        if (typeof s.windowStart === "number" && typeof s.windowEnd === "number") {
          for (let i = s.windowStart; i <= s.windowEnd; i++) highlights.push(mark(i, "window"));
        }
        const pointers: Pointer[] = isObject(s.pointers)
          ? Object.entries(s.pointers)
              .filter(([, v]) => typeof v === "number")
              .map(([name, v]) => ({ name, structure: id, target: String(v) }))
          : [];
        return { state: { structure: id, items: values }, highlights, pointers };
      });
    }
    case "stack":
    case "queue": {
      const base = items(raw[kind]);
      return build({ id, type: kind, label: kind }, (s, prev) => {
        const values = items(s[kind]) ?? prev?.items ?? base;
        return values ? { state: { structure: id, items: values } } : null;
      });
    }
    case "hashmap": {
      const base = hashmapEntries(raw.hashmap ?? raw.entries);
      return build({ id, type: "hashmap", label: "hash map" }, (s, prev) => {
        const entries = hashmapEntries(s.hashmap ?? s.entries) ?? prev?.entries ?? base;
        return entries ? { state: { structure: id, entries } } : null;
      });
    }
    case "matrix": {
      const toRows = (v: unknown) =>
        Array.isArray(v) && v.every(Array.isArray) ? (v as unknown[][]).map((r) => ({ cells: r.map(text) })) : null;
      const base = toRows(raw.matrix);
      return build({ id, type: "grid", label: "matrix" }, (s, prev) => {
        const rows = toRows(s.matrix) ?? prev?.rows ?? base;
        if (!rows) return null;
        return {
          state: { structure: id, rows },
          highlights: cells(s.highlightedCells).map((c) => mark(c, "current")),
        };
      });
    }
    case "linked_list": {
      const order = linkedOrder(raw.nodes);
      if (!order) return null;
      return build({ id, type: "linked_list", label: "linked list" }, (s) => ({
        state: { structure: id, items: order.values },
        highlights: (Array.isArray(s.highlightedNodes) ? s.highlightedNodes : [])
          .map((n) => order.ids.indexOf(text(n)))
          .filter((i) => i >= 0)
          .map((i) => mark(i, "current")),
      }));
    }
    default:
      // graph, tree, table: drawn by the old renderer until phase 2.
      return null;
  }
}
