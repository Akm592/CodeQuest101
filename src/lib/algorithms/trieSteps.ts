// A trie, character by character.
//
// The idea worth showing is that a prefix is not a word. After inserting
// "cat", "car", "card", "care", searching "ca" must return false even though
// every character matched — and the end-of-word marker is the visible proof.
// That is the single most-missed thing about tries, so the demo scripts below
// lead with it.
//
// Nodes are kept in a flat array keyed by the prefix string ("" for the root,
// "c", "ca", "cat"), not as a nested tree. Snapshotting is then a shallow copy
// per step rather than a deep clone, and layout becomes a pure function over
// the array. See trieLayout.ts.
//
// Pure functions: no React, no timers. Tested in trieSteps.test.ts.

import { type BaseStep, type GeneratorOptions, StepBuilder } from "./types";

export type TrieOp = "insert" | "search" | "prefix";
export type TrieAction =
  | "start"
  | "descend"
  | "create"
  | "mark-end"
  | "hit"
  | "miss"
  | "collect"
  | "done";

export interface TrieNodeSnapshot {
  /** The prefix this node spells. "" is the root. */
  id: string;
  /** The single character this node adds. "" at the root. */
  char: string;
  /** Parent's id, or null at the root. */
  parentId: string | null;
  /** True when a word ends here. */
  isEnd: boolean;
  depth: number;
}

export interface TrieStep extends BaseStep {
  op: TrieOp;
  action: TrieAction;
  /** The word being inserted or looked up. */
  word: string;
  /** Position within `word`; -1 while at the root. */
  charIndex: number;
  /** The node in focus. */
  nodeId: string;
  /** Flat snapshot of the whole trie at this moment. */
  nodes: TrieNodeSnapshot[];
  /** Node ids from the root to the current node. */
  activePath: string[];
  /** Words collected, for a prefix query. */
  matched: string[];
  /** Final answer of a search (boolean) or prefix query (word list). */
  result?: boolean | string[];
}

export interface TrieScript {
  op: TrieOp;
  word: string;
}

/** The internal trie, mutated as the script runs. */
type TrieMap = Map<string, TrieNodeSnapshot>;

function emptyTrie(): TrieMap {
  const nodes: TrieMap = new Map();
  nodes.set("", { id: "", char: "", parentId: null, isEnd: false, depth: 0 });
  return nodes;
}

/** Fresh copies, so a step can never be mutated by a later one. */
function snapshotNodes(nodes: TrieMap): TrieNodeSnapshot[] {
  return [...nodes.values()].map((n) => ({ ...n }));
}

/** Every word stored at or below `prefix`, in sorted order. */
function wordsUnder(nodes: TrieMap, prefix: string): string[] {
  const out: string[] = [];
  for (const node of nodes.values()) {
    if (node.isEnd && node.id.startsWith(prefix)) out.push(node.id);
  }
  return out.sort();
}

export interface TrieResult {
  steps: TrieStep[];
  /** The trie after the whole script has run. */
  finalNodes: TrieNodeSnapshot[];
  /** Answers, in script order. */
  results: (boolean | string[])[];
}

export function buildTrieSteps(
  script: TrieScript[],
  options: GeneratorOptions = {},
): TrieResult {
  const builder = new StepBuilder<TrieStep>(options);
  const nodes = emptyTrie();
  const results: (boolean | string[])[] = [];

  const snap = (
    op: TrieOp,
    action: TrieAction,
    word: string,
    charIndex: number,
    nodeId: string,
    explanation: string,
    extra: Partial<TrieStep> = {},
  ): boolean => {
    const activePath: string[] = [];
    for (let k = 0; k <= nodeId.length; k++) activePath.push(nodeId.slice(0, k));
    return builder.push({
      op,
      action,
      word,
      charIndex,
      nodeId,
      nodes: snapshotNodes(nodes),
      activePath,
      matched: [],
      explanation,
      ...extra,
    });
  };

  for (const { op, word } of script) {
    if (builder.isFull) break;

    if (op === "insert") {
      snap("insert", "start", word, -1, "", `Insert "${word}": start at the root.`);
      let prefix = "";
      for (let i = 0; i < word.length && !builder.isFull; i++) {
        const char = word[i];
        const next = prefix + char;
        if (nodes.has(next)) {
          snap("insert", "descend", word, i, next, `'${char}' already exists — reuse it. This is the prefix sharing that makes a trie compact.`);
        } else {
          nodes.set(next, { id: next, char, parentId: prefix, isEnd: false, depth: next.length });
          snap("insert", "create", word, i, next, `No '${char}' here yet — create a node for "${next}".`);
        }
        prefix = next;
      }
      const leaf = nodes.get(prefix);
      if (leaf) leaf.isEnd = true;
      snap("insert", "mark-end", word, word.length - 1, prefix, `Mark "${word}" as a complete word. Without this marker the trie could not tell a word from a prefix.`);
      results.push(true);
      continue;
    }

    if (op === "search") {
      snap("search", "start", word, -1, "", `Search "${word}": start at the root.`);
      let prefix = "";
      let fell = false;
      for (let i = 0; i < word.length && !builder.isFull; i++) {
        const char = word[i];
        const next = prefix + char;
        if (!nodes.has(next)) {
          snap("search", "miss", word, i, prefix, `No '${char}' branch from "${prefix}" — "${word}" is not in the trie.`, {
            result: false,
          });
          fell = true;
          break;
        }
        prefix = next;
        snap("search", "descend", word, i, next, `Matched '${char}' — now at "${next}".`);
      }

      if (!fell) {
        const isEnd = nodes.get(prefix)?.isEnd ?? false;
        results.push(isEnd);
        snap(
          "search",
          isEnd ? "hit" : "miss",
          word,
          word.length - 1,
          prefix,
          isEnd
            ? `"${word}" is marked as a complete word — found.`
            : `Every character matched, but "${word}" is not marked as the end of a word. A prefix is not a word, so this is a miss.`,
          { result: isEnd },
        );
      } else {
        results.push(false);
      }
      continue;
    }

    // op === "prefix"
    snap("prefix", "start", word, -1, "", `Find every word starting with "${word}".`);
    let prefix = "";
    let fell = false;
    for (let i = 0; i < word.length && !builder.isFull; i++) {
      const char = word[i];
      const next = prefix + char;
      if (!nodes.has(next)) {
        snap("prefix", "miss", word, i, prefix, `No '${char}' branch from "${prefix}" — nothing starts with "${word}".`, {
          result: [],
        });
        fell = true;
        break;
      }
      prefix = next;
      snap("prefix", "descend", word, i, next, `Matched '${char}' — now at "${next}".`);
    }

    if (fell) {
      results.push([]);
    } else {
      const found = wordsUnder(nodes, prefix);
      results.push(found);
      snap("prefix", "collect", word, word.length - 1, prefix, `Everything below "${prefix}" shares that prefix: ${found.length ? found.join(", ") : "nothing"}.`, {
        matched: found,
        result: found,
      });
    }
  }

  const steps = builder.finish({
    op: script[script.length - 1]?.op ?? "insert",
    action: "done",
    word: script[script.length - 1]?.word ?? "",
    charIndex: -1,
    nodeId: "",
    nodes: snapshotNodes(nodes),
    activePath: [],
    matched: [],
    done: true,
    explanation: `Done. The trie holds ${wordsUnder(nodes, "").length} word${wordsUnder(nodes, "").length === 1 ? "" : "s"} in ${nodes.size - 1} node${nodes.size - 1 === 1 ? "" : "s"}.`,
  });

  return { steps, finalNodes: snapshotNodes(nodes), results };
}

/** The seeded vocabulary and demo queries the visualizer opens with. */
export const TRIE_DEMO_WORDS = ["cat", "car", "card", "care", "dog", "do"];

export const TRIE_DEMOS: Record<string, TrieScript[]> = {
  build: TRIE_DEMO_WORDS.map((word) => ({ op: "insert" as const, word })),
  searchHit: [{ op: "search", word: "card" }],
  // The important one: every character of "ca" matches and it is still not a word.
  searchPrefixIsNotAWord: [{ op: "search", word: "ca" }],
  prefixQuery: [{ op: "prefix", word: "ca" }],
};
