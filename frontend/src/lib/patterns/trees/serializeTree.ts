// Serialize and Deserialize Binary Tree (NeetCode 150 · Trees).

import py from "../../guides/python/neetcode/serialize_tree.py?raw";
import { row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Level, type T, fromLevel, layout, randomTree, showLevel, toLevel } from "./tree";

type Input = Level;

export function serialize(arr: Level): string[] {
  const out: string[] = [];
  const go = (t: T | null) => {
    if (!t) return void out.push("N");
    out.push(String(t.val));
    go(t.left);
    go(t.right);
  };
  go(fromLevel(arr));
  return out;
}

function run(arr: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const root = fromLevel(arr);
  const tokens: string[] = [];
  const written = new Set<string>();
  let copy: T | null = null;
  let at: string | null = null;
  let read = -1;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const phase2 = stage === "read" || stage === "done";
    steps.push({
      stage,
      explanation,
      rows: [row(phase2 ? "the string, read left to right" : "the string so far", tokens, Object.fromEntries(tokens.map((tk, i) => [i, phase2 ? (i < read ? "idle" : i === read ? "current" : undefined) : i === tokens.length - 1 ? "current" : tk === "N" ? "idle" : undefined])))],
      tree: phase2 ? { title: "rebuilt from the string", nodes: layout(copy, { tone: (t) => (t.id === at ? "current" : "found") }) } : { title: "the original tree", nodes: layout(root, { tone: (t) => (t.id === at ? "current" : written.has(t.id) ? "found" : undefined) }) },
      vars: [{ name: "tokens", value: String(tokens.length) }],
      ops,
      ...extra,
    });
  };
  snap("start", "Write the tree in preorder (node, then left subtree, then right subtree), with N for every missing child. The N markers record the shape exactly, so the string can be read back the same way.");
  const write = (t: T | null) => {
    ops++;
    if (!t) {
      tokens.push("N");
      snap("write", "An empty spot: write N.");
      return;
    }
    tokens.push(String(t.val));
    written.add(t.id);
    at = t.id;
    snap("write", `Write ${t.val}, then its left subtree, then its right subtree.`);
    write(t.left);
    write(t.right);
  };
  write(root);
  at = null;
  // Read back.
  let i = 0;
  const readOne = (id: string, attach: (t: T) => void): void => {
    read = i;
    const tk = tokens[i++];
    ops++;
    if (tk === "N") {
      snap("read", "Read N: this spot stays empty. Go back up.");
      return;
    }
    const t: T = { id, val: Number(tk), left: null, right: null };
    attach(t);
    at = id;
    snap("read", `Read ${tk}: make a node, then read its left subtree, then its right subtree, exactly as they were written.`);
    readOne(`${id}l`, (c) => (t.left = c));
    readOne(`${id}r`, (c) => (t.right = c));
  };
  readOne("r", (t) => (copy = t));
  at = null;
  read = tokens.length;
  const s = tokens.join(",");
  snap("done", `The string “${s}” rebuilds the same tree: ${showLevel(toLevel(copy))}.`, { done: true, answer: s });
  return steps;
}

export const serializeTree: PatternProblem<Input> = {
  id: "serialize-tree",
  title: "Serialize and Deserialize Binary Tree",
  difficulty: "Hard",
  blind75: true,
  slug: "serialize-and-deserialize-binary-tree",
  video: "u4JAi2JJhI8",
  statement: "Design two functions: one turns a binary tree into a string, the other turns that string back into the same tree. Any format works, as long as it round-trips.",
  examples: [
    { label: "[1,2,3,null,null,4,5]", input: [1, 2, 3, null, null, 4, 5] },
    { label: "lopsided", input: [1, 2, null, 3] },
    { label: "empty", input: [] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return randomTree(g, g.int(1, 6), 1, 9);
  },
  describe: (arr) => `root = ${showLevel(arr)}`,
  run,
  solve: (arr) => serialize(arr).join(","),
  brute: null,
  bruteIdea: "Any correct format needs to visit every node, so O(n) is the best possible. Writing only the values isn't enough: without the N markers, different shapes give the same string.",
  guide: {
    title: "Serialize and Deserialize Binary Tree",
    idea: [
      "A preorder list of values alone doesn't fix the shape: [1,2] and [1,null,2] both give “1,2”. Writing N for every missing child does: “1,2,N,N,N” versus “1,N,2,N,N”.",
      "To read it back, do the same preorder walk: take the next token; N means empty, otherwise make a node and read its left subtree, then its right. The recursion consumes exactly what the writer produced.",
    ],
    whenToUse: ["Saving or sending a tree; comparing tree shapes as strings.", "Any recursive structure: encode the empty cases explicitly, and a matching recursive reader can rebuild it."],
    stages: [
      { id: "start", title: "Preorder with N markers", detail: "", pseudo: "def dfs(node): if not node: out.append('N'); return" },
      { id: "write", title: "Write node, left, right", detail: "", pseudo: "out.append(str(node.val)); dfs(node.left); dfs(node.right)" },
      { id: "read", title: "Read node, left, right", detail: "N → None.", pseudo: "t = next(tokens); if t == 'N': return None" },
      { id: "done", title: "The same tree", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "Current node / token" },
      { tone: "found", label: "Written / rebuilt" },
      { tone: "idle", label: "N markers / read" },
    ],
    complexity: { time: "O(n)", space: "O(n)", why: "One token per node and per empty child (n + 1 of those)." },
    pitfalls: ["Values can have several digits or be negative: separate tokens with commas.", "Deserialize must read in exactly the order serialize wrote."],
    tryThis: ["Pick “lopsided” and read the string aloud: every N closes off a branch.", "Pick “empty”: the whole tree is one N."],
    python: py,
  },
};
