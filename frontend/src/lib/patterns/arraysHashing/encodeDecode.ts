// Encode and Decode Strings (NeetCode 150 · Arrays & Hashing).

import py from "../../guides/python/neetcode/encode_decode.py?raw";
import { quote, row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = string[];

export const encode = (strs: string[]) => strs.map((s) => `${s.length}#${s}`).join("");
export function decode(s: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < s.length) {
    let j = i;
    while (s[j] !== "#") j++;
    const len = Number(s.slice(i, j));
    out.push(s.slice(j + 1, j + 1 + len));
    i = j + 1 + len;
  }
  return out;
}

function run(strs: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  let encoded = "";
  let ops = 0;
  const wordsRow = (hi: number | null, tone: "current" | "found" = "current") => row("strs", strs.map(quote), hi === null ? {} : { [hi]: tone });
  strs.forEach((w, k) => {
    const start = encoded.length;
    encoded += `${w.length}#${w}`;
    ops += w.length + 2;
    const tones = Object.fromEntries([...encoded].map((_, i) => [i, i >= start ? ("current" as const) : undefined]));
    steps.push({ stage: "encode", explanation: `Write “${w}” as its length, a #, then the word itself: ${w.length}#${w}`, rows: [wordsRow(k), row("encoded", [...encoded], tones)], vars: [{ name: "length", value: String(w.length), tone: "pointer" }], ops });
  });
  const chars = [...encoded];
  const out: string[] = [];
  let i = 0;
  while (i < encoded.length) {
    let j = i;
    while (encoded[j] !== "#") j++;
    const len = Number(encoded.slice(i, j));
    ops += j - i + 1;
    steps.push({
      stage: "readLength",
      explanation: `Read digits from position ${i} up to the first #: the next word has ${len} character${len === 1 ? "" : "s"}.`,
      rows: [row("encoded", chars, { ...Object.fromEntries(Array.from({ length: j - i }, (_, t) => [i + t, "pointer"])), [j]: "compare" }, { [i]: "i", [j]: "j" }), row("decoded", out.map(quote))],
      vars: [{ name: "length", value: String(len), tone: "pointer" }],
      ops,
    });
    const word = encoded.slice(j + 1, j + 1 + len);
    out.push(word);
    ops += len;
    steps.push({
      stage: "readWord",
      explanation: `Take exactly ${len} characters after the #, whatever they are (even # or digits): “${word}”.`,
      rows: [row("encoded", chars, Object.fromEntries(Array.from({ length: len }, (_, t) => [j + 1 + t, "found"])), { [j + 1]: len ? "start" : undefined }), row("decoded", out.map(quote), { [out.length - 1]: "found" })],
      vars: [{ name: "length", value: String(len), tone: "pointer" }],
      ops,
    });
    i = j + 1 + len;
  }
  steps.push({ stage: "done", explanation: `Decoded ${out.length} word${out.length === 1 ? "" : "s"}, exactly the original list.`, rows: [row("encoded", chars), row("decoded", out.map(quote), Object.fromEntries(out.map((_, t) => [t, "found"])))], vars: [], ops, done: true, answer: `[${out.map(quote).join(", ")}]` });
  return steps;
}

export const encodeDecode: PatternProblem<Input> = {
  id: "encode-decode",
  title: "Encode and Decode Strings",
  difficulty: "Medium",
  blind75: true,
  slug: "encode-and-decode-strings",
  video: "B1k_sxOSgv8",
  statement: "Design encode, which turns a list of strings into one string, and decode, which turns it back into the exact same list. The strings can contain any characters. (LeetCode Premium; NeetCode has a free version.)",
  examples: [
    { label: "neet code love you", input: ["neet", "code", "love", "you"] },
    { label: "tricky: # and digits", input: ["we#", "4you", "", "3#a"] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const alphabet = [..."ab#12z"];
    return Array.from({ length: g.int(2, 4) }, () => Array.from({ length: g.int(0, 4) }, () => g.pick(alphabet)).join(""));
  },
  describe: (strs) => `strs = [${strs.map(quote).join(", ")}]`,
  run,
  solve: (strs) => decode(encode(strs)),
  brute: null,
  bruteIdea: "There's no slow-but-correct version here. The tempting shortcut, joining with a separator like “,”, is simply wrong: a word containing “,” splits in two when decoded.",
  guide: {
    title: "Encode and Decode Strings",
    idea: [
      "Joining words with a separator fails as soon as a word contains that separator. Escaping characters works but is fiddly.",
      "The clean fix is to say how long each word is before it: “4#neet”. When decoding, read the number up to the first #, then take exactly that many characters, no matter what they are. A # or digit inside a word can never be mistaken for structure, because you never look inside a word for one.",
    ],
    whenToUse: ["Sending a list over a single string or network message: length-prefixing is how many real protocols frame data.", "Any “design an encoding” question: think about which characters could be ambiguous."],
    stages: [
      { id: "encode", title: "Encode: length, #, word", detail: "Append each word with its length in front.", pseudo: "out += f\"{len(s)}#{s}\"" },
      { id: "readLength", title: "Decode: read the length", detail: "Read digits up to the next #.", pseudo: "while s[j] != '#': j += 1" },
      { id: "readWord", title: "Decode: take that many characters", detail: "Slice exactly length characters after the #.", pseudo: "word = s[j+1 : j+1+length]" },
      { id: "done", title: "Back to the original list", detail: "Every word recovered exactly, including empty ones.", pseudo: "return words" },
    ],
    legend: [
      { tone: "current", label: "Just encoded" },
      { tone: "pointer", label: "Length digits" },
      { tone: "compare", label: "The # after the length" },
      { tone: "found", label: "Word read back" },
    ],
    complexity: { time: "O(total characters)", space: "O(total characters)", why: "Each character is written once and read once." },
    pitfalls: [
      "Lengths can have more than one digit (a 12-letter word is “12#…”), so read up to the #, not just one character.",
      "Empty strings must survive: “0#” decodes to “”.",
    ],
    tryThis: ["Pick “tricky: # and digits” and watch “3#a” come back intact.", "Press “Random” for words full of # and digits."],
    python: py,
  },
};
