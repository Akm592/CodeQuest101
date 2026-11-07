// Interview Patterns · Arrays & Hashing (the first NeetCode 150 category).

import * as React from "react";

import { ARRAYS_HASHING } from "../../lib/patterns/arraysHashing";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, Arrowhead, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const Box: React.FC<{ x: number; y: number; t: string; tone?: string; w?: number }> = ({ x, y, t, tone, w = 22 }) => (
  <g>
    <rect x={x} y={y} width={w} height={22} rx={5} fill={tone ? tone : C.card} fillOpacity={tone ? 0.25 : 1} stroke={tone ?? C.grid} />
    <text x={x + w / 2} y={y + 15} textAnchor="middle" fontSize={11} fill={C.fg}>
      {t}
    </text>
  </g>
);

const figures: ConceptFigure[] = [
  {
    title: "Scan vs look up",
    caption: "Searching a list checks items one by one: up to n steps. A hash set or map jumps straight to where the value would be: about one step.",
    art: (
      <Art label="Top: an arrow checking eight boxes one by one. Bottom: an arrow going directly to one box.">
        <Arrowhead id="ah-scan" color={C.red} />
        <Arrowhead id="ah-hash" color={C.green} />
        <text x={10} y={18} fontSize={10} fill={C.redText}>list: check each one</text>
        {[3, 8, 1, 9, 4, 7, 2, 6].map((v, i) => (
          <Box key={i} x={10 + i * 27} y={26} t={String(v)} tone={i < 5 ? (i === 4 ? C.red : C.idle) : undefined} />
        ))}
        <path d="M21,56 C60,70 100,70 128,52" fill="none" stroke={C.red} strokeWidth={1.5} markerEnd="url(#ah-scan)" />
        <text x={10} y={84} fontSize={10} fill={C.green}>hash set: jump to it</text>
        <text x={14} y={122} fontSize={11} fill={C.fg}>4?</text>
        <path d="M30,112 C70,92 150,90 188,104" fill="none" stroke={C.green} strokeWidth={1.5} markerEnd="url(#ah-hash)" />
        {["1", "2", "3", "4", "6"].map((v, i) => (
          <Box key={v} x={100 + i * 27} y={107} t={v} tone={v === "4" ? C.green : undefined} />
        ))}
      </Art>
    ),
  },
  {
    title: "Count, don't compare",
    caption: "“listen” and “silent” look different, but their letter counts are identical. Counting with a map turns “same letters?” into a quick check.",
    art: (
      <Art label="Two words with identical bar charts of letter counts">
        {["listen", "silent"].map((w, k) => (
          <g key={w}>
            <text x={60 + k * 120} y={18} textAnchor="middle" fontSize={12} fill={C.fg}>“{w}”</text>
            {["e", "i", "l", "n", "s", "t"].map((c, i) => (
              <g key={c}>
                <rect x={16 + k * 120 + i * 15} y={100 - 40} width={11} height={40} rx={2} fill={k ? C.violet : C.teal} opacity={0.8} />
                <text x={21.5 + k * 120 + i * 15} y={114} textAnchor="middle" fontSize={10} fill={C.muted}>{c}</text>
              </g>
            ))}
          </g>
        ))}
        <text x={120} y={138} textAnchor="middle" fontSize={11} fill={C.green}>same counts → anagrams</text>
      </Art>
    ),
  },
  {
    title: "Precompute in a pass",
    caption: "Sweep once left to right and once right to left, carrying a running product or sum. Then each answer is ready without re-scanning.",
    art: (
      <Art label="An array with an arrow sweeping right on top and an arrow sweeping left underneath">
        <Arrowhead id="ah-pre" color={C.teal} />
        <Arrowhead id="ah-suf" color={C.amber} />
        <text x={16} y={30} fontSize={10} fill={C.teal}>prefix: product so far →</text>
        <path d="M18,40 L218,40" stroke={C.teal} strokeWidth={1.5} markerEnd="url(#ah-pre)" />
        {[1, 2, 3, 4].map((v, i) => (
          <Box key={i} x={40 + i * 42} y={58} t={String(v)} w={32} />
        ))}
        <path d="M218,100 L18,100" stroke={C.amber} strokeWidth={1.5} markerEnd="url(#ah-suf)" />
        <text x={224} y={120} textAnchor="end" fontSize={10} fill={C.amber}>← suffix: product so far</text>
        <text x={120} y={142} textAnchor="middle" fontSize={11} fill={C.fg}>answer[i] = prefix × suffix</text>
      </Art>
    ),
  },
];

const Intro: React.FC = () => (
  <section aria-labelledby="ah-pattern-title" className="space-y-4">
    <SectionTitle id="ah-pattern-title" kicker="The pattern" title="Arrays & Hashing: trade a little memory for a lot of speed">
      <p>
        Most “find”, “count” and “have I seen this?” questions have a slow answer that compares everything with everything (O(n²)) and a fast
        answer that walks the data once while remembering what it saw in a hash set or hash map (O(n)). This category is where every other pattern
        starts, which is why NeetCode puts it first.
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="space-y-2 p-4">
        <h3 className="font-semibold text-foreground">How to spot it</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>“Have I seen this before?”, “any duplicates?” → a hash set.</li>
          <li>“Find a partner / complement” (like target − x) → a hash map of what you've seen.</li>
          <li>“Same letters”, “how many of each”, “most frequent” → count with a hash map.</li>
          <li>“Group things that are equivalent” → find a key every member shares, then hash on it.</li>
          <li>“Everything except i”, range sums or products → prefix and suffix passes.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="space-y-2 p-4">
        <h3 className="font-semibold text-foreground">The toolkit (Python)</h3>
        <ul className="space-y-1.5 font-mono text-[13px] leading-relaxed text-muted-foreground">
          <li><span className="text-foreground">seen = set()</span>: add / check membership in O(1) on average</li>
          <li><span className="text-foreground">index_of = {"{}"}</span>: value → position, or key → anything</li>
          <li><span className="text-foreground">Counter(xs)</span> or a dict: value → how many</li>
          <li><span className="text-foreground">defaultdict(list)</span>: key → group of items</li>
          <li><span className="text-foreground">prefix</span>: a running total carried through one pass</li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Hash lookups are O(1) on average; a badly distributed hash can make them slower, which is why answers say “on average”.
        </p>
      </Surface>
    </div>
  </section>
);

const ArraysHashingPage: React.FC = () => <PatternPage category="Arrays & Hashing" intro={<Intro />} problems={ARRAYS_HASHING} />;

export default ArraysHashingPage;
