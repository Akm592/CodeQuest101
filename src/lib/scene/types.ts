// A scene: the chat's step-by-step visualization format.
//
// Mirrors app/schemas/visualization_schemas.py in the backend, field for field
// (snake_case included, so nothing is renamed in transit). The backend builds
// scenes with Gemini structured output and validates them; validate.ts checks
// them again here before anything is drawn, because a scene can also come from
// an older backend, from stored history, or from the legacy adapter.

export type StructureType =
  | "array"
  | "bars"
  | "hashmap"
  | "set"
  | "stack"
  | "queue"
  | "linked_list"
  | "grid"
  | "variables";

export const STRUCTURE_TYPES: readonly StructureType[] = [
  "array",
  "bars",
  "hashmap",
  "set",
  "stack",
  "queue",
  "linked_list",
  "grid",
  "variables",
];

export type HighlightRole = "current" | "compare" | "swap" | "found" | "visited" | "window";

export interface Entry {
  key: string;
  value: string;
}

export interface StructureSpec {
  id: string;
  type: StructureType;
  label: string;
}

export interface StructureState {
  structure: string;
  items?: string[];
  entries?: Entry[];
  rows?: { cells: string[] }[];
}

export interface Highlight {
  structure: string;
  target: string;
  role: HighlightRole;
  label?: string;
}

export interface Pointer {
  name: string;
  structure: string;
  target: string;
}

export interface Variable {
  name: string;
  value: string;
}

export interface SceneStep {
  title: string;
  explanation: string;
  code_line?: number;
  states: StructureState[];
  highlights?: Highlight[];
  pointers?: Pointer[];
  variables?: Variable[];
}

export interface Scene {
  title: string;
  summary: string;
  structures: StructureSpec[];
  code?: { language: string; lines: string[] };
  steps: SceneStep[];
}

// ---------------------------------------------------------------------------
// Suggestions
// ---------------------------------------------------------------------------

export interface TraceRequest {
  problem: string;
  input: string;
  approach: string;
}

export interface Suggestion {
  title: string;
  /**
   * "context": trace whatever the conversation is about; the backend picks the
   * example when the button is clicked. "trace": a specific request, from
   * suggestions saved by the first version.
   */
  kind: "context" | "trace";
  trace?: TraceRequest;
}

/** What POST /chat/visualize returns: a scene, or the model declining with a reason. */
export type SceneOutcome = { feasible: true; scene: Scene } | { feasible: false; reason: string };
