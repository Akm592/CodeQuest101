// Valid Palindrome (NeetCode 150 · Two Pointers).

import py from "../../guides/python/neetcode/valid_palindrome.py?raw";
import { quote, row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = string;
const alnum = (c: string) => /[a-z0-9]/i.test(c);
const shown = (c: string) => (c === " " ? "␣" : c);

function run(s: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const chars = [...s].map(shown);
  const done = new Set<number>();
  let ops = 0;
  const push = (stage: string, l: number, r: number, explanation: string, extra: Partial<PatternStep> = {}) => {
    const tones: Record<number, "current" | "found" | "swap" | "idle" | undefined> = {};
    chars.forEach((_, i) => (tones[i] = done.has(i) ? "found" : !alnum(s[i]) && (i < l || i > r) ? "idle" : undefined));
    if (l < s.length) tones[l] = stage === "mismatch" ? "swap" : "current";
    if (r >= 0) tones[r] = stage === "mismatch" ? "swap" : "current";
    steps.push({ stage, explanation, rows: [row("s", chars, tones, { [l]: "L", [r]: l === r ? "L R" : "R" })], vars: [{ name: "L", value: String(l) }, { name: "R", value: String(r) }], ops, ...extra });
  };
  let l = 0;
  let r = s.length - 1;
  push("start", l, r, "Put L at the start and R at the end. Compare letters moving inwards, ignoring case, spaces and punctuation.");
  while (l < r) {
    ops++;
    if (!alnum(s[l])) {
      push("skip", l, r, `“${shown(s[l])}” isn't a letter or digit, so move L past it.`);
      l++;
    } else if (!alnum(s[r])) {
      push("skip", l, r, `“${shown(s[r])}” isn't a letter or digit, so move R past it.`);
      r--;
    } else if (s[l].toLowerCase() !== s[r].toLowerCase()) {
      push("mismatch", l, r, `“${s[l]}” and “${s[r]}” differ, so it isn't a palindrome.`, { done: true, answer: "false" });
      return steps;
    } else {
      push("match", l, r, `“${s[l]}” and “${s[r]}” match (ignoring case). Move both pointers inwards.`);
      done.add(l);
      done.add(r);
      l++;
      r--;
    }
  }
  push("palindrome", l, r, "The pointers met without a mismatch: it reads the same both ways.", { done: true, answer: "true" });
  return steps;
}

const PHRASES = ["A man, a plan, a canal: Panama", "race a car", "Was it a car or a cat I saw?", "No lemon, no melon", "Step on no pets!", "Hello, world", "Madam, in Eden, I'm Adam", "abca"];

export const validPalindrome: PatternProblem<Input> = {
  id: "valid-palindrome",
  title: "Valid Palindrome",
  difficulty: "Easy",
  blind75: true,
  slug: "valid-palindrome",
  video: "jJXJ16kPFWg",
  statement: "Given a string, return true if it reads the same forwards and backwards once you ignore upper/lower case and remove everything that isn't a letter or digit.",
  examples: [
    { label: "A man, a plan…", input: "A man, a plan, a canal: Panama" },
    { label: "race a car", input: "race a car" },
    { label: "Was it a car…", input: "Was it a car or a cat I saw?" },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return g.pick(PHRASES);
  },
  describe: (s) => `s = ${quote(s)}`,
  run,
  solve: (s) => {
    const t = [...s].filter(alnum).join("").toLowerCase();
    return t === [...t].reverse().join("");
  },
  brute: null,
  bruteIdea: "The obvious way builds a cleaned copy of the string and compares it with its reverse. That's O(n) time too, but it needs O(n) extra memory. Two pointers checks in place with O(1) memory.",
  guide: {
    title: "Valid Palindrome",
    idea: [
      "A palindrome's first character matches its last, its second matches its second-to-last, and so on. So put one pointer at each end and walk them towards each other, comparing as you go.",
      "Characters that don't count (spaces, punctuation) are simply skipped by whichever pointer is on them. Nothing is copied, so memory stays O(1).",
    ],
    whenToUse: ["“Reads the same both ways”, “mirror”, “reverse in place”: pointers at both ends moving inwards.", "Whenever you'd compare position i with position n − 1 − i."],
    stages: [
      { id: "start", title: "Pointers at both ends", detail: "L at index 0, R at the last index.", pseudo: "l, r = 0, len(s) - 1" },
      { id: "skip", title: "Skip what doesn't count", detail: "Move a pointer past spaces and punctuation.", pseudo: "if not s[l].isalnum(): l += 1" },
      { id: "match", title: "Match → move both inwards", detail: "Same character (ignoring case): this pair is fine.", pseudo: "l += 1; r -= 1" },
      { id: "mismatch", title: "Mismatch → not a palindrome", detail: "One differing pair is enough to say no.", pseudo: "return False" },
      { id: "palindrome", title: "Pointers met → palindrome", detail: "Every pair matched.", pseudo: "return True" },
    ],
    legend: [
      { tone: "current", label: "L and R" },
      { tone: "found", label: "Matched pair" },
      { tone: "swap", label: "Mismatch" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "Each step moves at least one pointer inwards, so there are at most n steps, and nothing is copied." },
    pitfalls: [
      "Forgetting case: “A” and “a” must count as equal.",
      "Use l < r in the skip loops too, or a string of only punctuation can run a pointer off the end.",
    ],
    tryThis: ["Pick “race a car”: watch where it fails.", "Pick “Was it a car…” and count how many characters are skipped."],
    python: py,
  },
};
