// Runtime checks for scenes and suggestions arriving from the network.
//
// The old renderer took whatever JSON arrived and drew it: a short table row
// threw inside p5's draw loop every frame, strings fed to the sorting bars gave
// NaN heights, and an unknown type showed a blank canvas. Here anything that
// would draw wrongly is rejected up front with a message the player can show.

import {
  STRUCTURE_TYPES,
  type HighlightRole,
  type Scene,
  type SceneStep,
  type StructureState,
  type Suggestion,
} from "./types";

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

const ROLES: readonly HighlightRole[] = ["current", "compare", "swap", "found", "visited", "window"];

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === "string";
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

// The model is told to send strings, but numbers are an easy slip and harmless.
const toText = (v: unknown): string | null =>
  typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" ? String(v) : null;

function normaliseItems(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  const out = v.map(toText);
  return out.every((x) => x !== null) ? (out as string[]) : null;
}

export function parseScene(raw: unknown): ParseResult<Scene> {
  const fail = (error: string): ParseResult<Scene> => ({ ok: false, error });

  if (!isObject(raw)) return fail("The visualization is empty.");
  if (!isString(raw.title)) return fail("The visualization has no title.");
  if (!Array.isArray(raw.structures) || raw.structures.length === 0) {
    return fail("The visualization declares no data structures.");
  }
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) {
    return fail("The visualization has no steps.");
  }

  const types = new Map<string, string>();
  for (const s of raw.structures) {
    if (!isObject(s) || !isString(s.id) || !isString(s.type)) {
      return fail("A data structure is missing its id or type.");
    }
    if (!(STRUCTURE_TYPES as readonly string[]).includes(s.type)) {
      return fail(`This visualization uses a "${s.type}", which can't be drawn yet.`);
    }
    if (types.has(s.id)) return fail(`Two data structures are both called "${s.id}".`);
    types.set(s.id, s.type);
  }

  let code: Scene["code"];
  if (raw.code != null) {
    if (!isObject(raw.code) || !isStringArray(raw.code.lines)) return fail("The code block is malformed.");
    code = { language: isString(raw.code.language) ? raw.code.language : "text", lines: raw.code.lines };
  }

  const steps: SceneStep[] = [];
  for (const [i, rawStep] of raw.steps.entries()) {
    const n = i + 1;
    if (!isObject(rawStep)) return fail(`Step ${n} is malformed.`);
    const explanation = isString(rawStep.explanation) ? rawStep.explanation.trim() : "";
    if (!explanation) return fail(`Step ${n} has no explanation.`);
    if (!Array.isArray(rawStep.states)) return fail(`Step ${n} has no state.`);

    const states: StructureState[] = [];
    for (const st of rawStep.states) {
      if (!isObject(st) || !isString(st.structure) || !types.has(st.structure)) {
        return fail(`Step ${n} refers to a data structure that isn't declared.`);
      }
      const kind = types.get(st.structure);
      const state: StructureState = { structure: st.structure };
      if (kind === "hashmap") {
        if (!Array.isArray(st.entries)) return fail(`Step ${n}: the hash map has no entries.`);
        const entries = st.entries.map((e) =>
          isObject(e) ? { key: toText(e.key), value: toText(e.value) } : null,
        );
        if (entries.some((e) => !e || e.key === null || e.value === null)) {
          return fail(`Step ${n}: a hash map entry is malformed.`);
        }
        state.entries = entries as { key: string; value: string }[];
      } else if (kind === "grid") {
        if (!Array.isArray(st.rows)) return fail(`Step ${n}: the grid has no rows.`);
        const rows = st.rows.map((r) => (isObject(r) ? normaliseItems(r.cells) : null));
        if (rows.some((r) => r === null)) return fail(`Step ${n}: a grid row is malformed.`);
        state.rows = (rows as string[][]).map((cells) => ({ cells }));
      } else if (kind !== "variables") {
        const items = normaliseItems(st.items);
        if (!items) return fail(`Step ${n}: "${st.structure}" has no items.`);
        if (kind === "bars" && items.some((x) => !Number.isFinite(Number(x)))) {
          return fail(`Step ${n}: the bars hold a value that isn't a number.`);
        }
        state.items = items;
      }
      states.push(state);
    }

    const highlights = Array.isArray(rawStep.highlights)
      ? rawStep.highlights
          .filter((h): h is Record<string, unknown> => isObject(h))
          .filter((h) => isString(h.structure) && types.has(h.structure) && toText(h.target) !== null)
          .filter((h) => (ROLES as readonly unknown[]).includes(h.role))
          .map((h) => ({
            structure: h.structure as string,
            target: toText(h.target) as string,
            role: h.role as HighlightRole,
            label: isString(h.label) ? h.label : undefined,
          }))
      : [];

    const pointers = Array.isArray(rawStep.pointers)
      ? rawStep.pointers
          .filter((p): p is Record<string, unknown> => isObject(p))
          .filter((p) => isString(p.name) && isString(p.structure) && types.has(p.structure) && toText(p.target) !== null)
          .map((p) => ({ name: p.name as string, structure: p.structure as string, target: toText(p.target) as string }))
      : [];

    const variables = Array.isArray(rawStep.variables)
      ? rawStep.variables
          .filter((v): v is Record<string, unknown> => isObject(v) && isString(v.name) && toText(v.value) !== null)
          .map((v) => ({ name: v.name as string, value: toText(v.value) as string }))
      : [];

    const codeLine =
      typeof rawStep.code_line === "number" && code && rawStep.code_line >= 1 && rawStep.code_line <= code.lines.length
        ? rawStep.code_line
        : undefined;

    steps.push({
      title: isString(rawStep.title) && rawStep.title.trim() ? rawStep.title : `Step ${n}`,
      explanation,
      code_line: codeLine,
      states,
      highlights,
      pointers,
      variables,
    });
  }

  return {
    ok: true,
    value: {
      title: raw.title,
      summary: isString(raw.summary) ? raw.summary : "",
      structures: (raw.structures as { id: string; type: string; label?: unknown }[]).map((s) => ({
        id: s.id,
        type: s.type as Scene["structures"][number]["type"],
        label: isString(s.label) ? s.label : s.id,
      })),
      code,
      steps,
    },
  };
}

/** Keep the well-formed suggestions; drop the rest silently. */
export function parseSuggestions(raw: unknown): Suggestion[] {
  if (!Array.isArray(raw)) return [];
  const out: Suggestion[] = [];
  for (const s of raw) {
    if (!isObject(s) || !isString(s.title) || !s.title.trim()) continue;
    if (s.kind === "trace" && isObject(s.trace)) {
      const { problem, input, approach } = s.trace;
      if (isString(problem) && isString(input) && isString(approach)) {
        out.push({ title: s.title, kind: "trace", trace: { problem, input, approach } });
      }
    }
    // "builtin" suggestions are not offered by the backend yet; ignored until
    // the chat can open the site's own visualizers.
  }
  return out.slice(0, 3);
}
