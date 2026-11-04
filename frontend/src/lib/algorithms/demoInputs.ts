// The inputs the visualizer pages run on, kept beside the generators rather
// than inside the components so the guide tests can run exactly what a visitor
// sees. If a page's demo changes here, the tests that check every guide stage
// is still reachable run against the new input automatically.

import type { Graph, NodeId } from "../../components/Graphs/Types";
import type { KnapsackItem } from "./dpSteps";
import { TRIE_DEMO_WORDS, type TrieScript } from "./trieSteps";

// ---------------------------------------------------------------------------
// Dynamic programming
// ---------------------------------------------------------------------------

export const DP_DEFAULT_STRINGS = { source: "kitten", target: "sitting" } as const;
export const DP_DEFAULT_CAPACITY = 10;

export const KNAPSACK_ITEMS: KnapsackItem[] = [
  { weight: 5, value: 10, label: "A" },
  { weight: 4, value: 40, label: "B" },
  { weight: 6, value: 30, label: "C" },
  { weight: 3, value: 50, label: "D" },
];

// ---------------------------------------------------------------------------
// Topological sort and union-find
// ---------------------------------------------------------------------------

/** A small course-prerequisite DAG: familiar shape, unambiguous ordering. */
export const BASE_DAG: Graph = {
  nodes: ["intro", "data", "algos", "discrete", "os", "compilers"],
  edges: [
    ["intro", "data", 1],
    ["intro", "discrete", 1],
    ["data", "algos", 1],
    ["discrete", "algos", 1],
    ["data", "os", 1],
    ["algos", "compilers", 1],
  ],
  directed: true,
};

/** Added to BASE_DAG by "Add a cycle", so Kahn's has nothing to start on. */
export const CYCLIC_EDGE: [NodeId, NodeId, number] = ["compilers", "intro", 1];

export const CYCLIC_DAG: Graph = { ...BASE_DAG, edges: [...BASE_DAG.edges, CYCLIC_EDGE] };

export const WEIGHTED_GRAPH: Graph = {
  nodes: ["A", "B", "C", "D", "E", "F"],
  edges: [
    ["A", "B", 2],
    ["A", "C", 3],
    ["B", "C", 1],
    ["B", "D", 4],
    ["C", "E", 6],
    ["D", "E", 5],
    ["D", "F", 7],
    ["E", "F", 2],
  ],
  directed: false,
};

// ---------------------------------------------------------------------------
// Trie
// ---------------------------------------------------------------------------

const SEED: TrieScript[] = TRIE_DEMO_WORDS.map((word) => ({ op: "insert" as const, word }));

export type TrieDemoKey = "build" | "searchHit" | "searchPrefix" | "searchMiss" | "prefixQuery";

/** Every demo starts from the seeded trie, then runs one operation on it. */
export const TRIE_PAGE_DEMOS: Record<TrieDemoKey, { label: string; script: TrieScript[] }> = {
  build: { label: "Build the trie", script: SEED },
  searchHit: { label: 'search("card") → found', script: [...SEED, { op: "search", word: "card" }] },
  searchPrefix: {
    label: 'search("ca") → a prefix is not a word',
    script: [...SEED, { op: "search", word: "ca" }],
  },
  searchMiss: {
    label: 'search("cab") → falls off the trie',
    script: [...SEED, { op: "search", word: "cab" }],
  },
  prefixQuery: {
    label: 'startsWith("ca") → four words',
    script: [...SEED, { op: "prefix", word: "ca" }],
  },
};

/** "Insert your own": the seed plus the visitor's word. */
export function trieCustomScript(rawWord: string): TrieScript[] {
  const word = rawWord.trim().toLowerCase().replace(/[^a-z]/g, "").slice(0, 10);
  return word ? [...SEED, { op: "insert" as const, word }] : SEED;
}
