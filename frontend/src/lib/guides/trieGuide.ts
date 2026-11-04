import type { TrieStep } from "../algorithms/trieSteps";
import triePy from "./python/trie.py?raw";
import type { AlgorithmGuide } from "./types";

export const trieGuide: AlgorithmGuide = {
  title: "Trie (Prefix Tree)",
  idea: [
    "A trie stores strings one character per level. Each node stands for a prefix, and its children are the letters that can follow it. Words that start the same way share the same path, so “car”, “card” and “care” share the nodes c → a → r.",
    "Every operation is a walk from the root, one letter at a time. Insert creates any missing nodes. Search and prefix queries just follow the existing ones. The cost depends on the length of the word, not on how many words are stored.",
    "Reaching a node is not the same as finding a word. “ca” has a node because “cat” passes through it, but nobody inserted “ca”. A flag on the node where each inserted word ends (the double ring here) is the only thing that tells a stored word from a prefix.",
  ],
  whenToUse: [
    "“Implement autocomplete”, “search suggestions”, “startsWith”, or “longest common prefix”.",
    "Word search on a grid with many target words: walk the grid and the trie together and prune any path that isn't a prefix.",
    "Any time you need many prefix lookups. A hash set can say whether a whole word exists, but not which words begin with a prefix.",
  ],
  stages: [
    {
      id: "start",
      title: "Start at the root",
      detail: "The root stands for the empty prefix. Every insert, search and prefix query begins there.",
      pseudo: "node = root",
    },
    {
      id: "walk",
      title: "Letter exists → follow it",
      detail: "There's already a child for the next letter, so move down to it. When inserting, this is prefix sharing: no new node needed.",
      pseudo: "node = node.children[ch]",
    },
    {
      id: "create",
      title: "Letter missing (insert) → add a node",
      detail: "No word stored so far continues with this letter, so make a new child and keep going.",
      pseudo: "node.children[ch] = TrieNode()",
    },
    {
      id: "mark",
      title: "Mark where the word ends",
      detail: "After the last letter, flag the node as the end of a word. Without the flag, “car” would be indistinguishable from the prefix of “card”.",
      pseudo: "node.is_end = True",
    },
    {
      id: "missing",
      title: "Letter missing (lookup) → not found",
      detail: "The path falls off the trie, so no stored word starts this way. Stop early: there's no need to look at anything else.",
      pseudo: "if ch not in node.children: return False",
    },
    {
      id: "checkEnd",
      title: "All letters matched → check the end flag",
      detail: "The word is stored only if its last node is flagged. If every letter matched but the flag is off, it's just a prefix of longer words.",
      pseudo: "return node.is_end",
    },
    {
      id: "collect",
      title: "Collect every word below the prefix",
      detail: "Everything under the prefix's node starts with that prefix. A depth-first walk of that subtree gathers each flagged node.",
      pseudo: "dfs(node): if node.is_end: yield word",
    },
    {
      id: "done",
      title: "Done",
      detail: "The trie now holds every inserted word, with shared prefixes stored once.",
      pseudo: "",
    },
  ],
  legend: [
    { tone: "current", label: "Current node and the path to it" },
    { tone: "compare", label: "Node just created" },
    { tone: "found", label: "A word ends here (double ring)" },
    { tone: "visited", label: "Words matched by a prefix query" },
    { tone: "swap", label: "Lookup fell off the trie" },
  ],
  complexity: {
    time: "O(L) per operation",
    space: "O(total letters stored)",
    why: "Insert and search touch one node per letter of the word, however many words are stored. A prefix query costs O(L) to reach the prefix, plus the size of the subtree it collects. In the worst case, with no shared prefixes, the trie stores one node per letter of every word.",
  },
  pitfalls: [
    "Returning true from search just because the walk reached a node. Check the end-of-word flag, or every prefix counts as a word.",
    "Storing a fixed array of 26 children for small or sparse alphabets. That wastes memory, while a dict or map grows only as needed.",
    "Forgetting to mark the end when one word is a prefix of another. Inserting “card” after “car” must leave car's flag set.",
    "Rebuilding the prefix string at every node during collection without passing it down. Carry the spelled prefix with the walk.",
  ],
  tryThis: [
    "Run search(\"ca\"). Every letter matches, and it's still a miss, because the end flag is off.",
    "Run search(\"cab\"). The walk falls off at b and stops without checking anything else.",
    "Insert your own word that shares a prefix, like “cart”. Only one new node appears.",
  ],
  python: triePy,
};

export function trieGuideStepFor(step: TrieStep): string {
  switch (step.action) {
    case "start":
      return "start";
    case "descend":
      return "walk";
    case "create":
      return "create";
    case "mark-end":
      return "mark";
    case "hit":
      return "checkEnd";
    case "miss":
      // Two kinds of miss: the walk fell off part-way (stopped on a shorter
      // prefix), or every letter matched and the end flag was off (stopped on
      // the word itself).
      return step.nodeId === step.word ? "checkEnd" : "missing";
    case "collect":
      return "collect";
    default:
      return "done";
  }
}
