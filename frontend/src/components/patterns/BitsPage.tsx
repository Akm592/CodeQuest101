// Interview Patterns · Bit Manipulation (the eighteenth and last NeetCode 150 category).

import * as React from "react";

import { BITS } from "../../lib/patterns/bits";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const W = 22;
const Bits: React.FC<{ x: number; y: number; bits: string; label: string; tone?: (i: number) => string | undefined }> = ({ x, y, bits, label, tone }) => (
  <g>
    <text x={x - 8} y={y + 15} textAnchor="end" fontSize={10} fontFamily="ui-monospace, monospace" fill={C.muted}>{label}</text>
    {[...bits].map((b, i) => {
      const t = tone?.(i) ?? (b === "1" ? C.sky : undefined);
      return (
        <g key={i}>
          <rect x={x + i * W} y={y} width={W - 3} height={W - 2} rx={4} fill={t ?? C.card} fillOpacity={t ? 0.3 : 1} stroke={t ?? C.grid} />
          <text x={x + i * W + (W - 3) / 2} y={y + 14} textAnchor="middle" fontSize={11} fontFamily="ui-monospace, monospace" fill={C.fg}>{b}</text>
        </g>
      );
    })}
  </g>
);

const figures: ConceptFigure[] = [
  {
    title: "XOR cancels pairs",
    caption: "x ^ x = 0 and x ^ 0 = x, in any order. XOR a list where everything appears twice except one number, and only that number survives.",
    art: (
      <Art label="Five XOR five is zero, and five XOR three is six">
        <Bits x={80} y={22} bits="0101" label="5" />
        <Bits x={80} y={48} bits="0101" label="^ 5" />
        <line x1={80} x2={166} y1={74} y2={74} stroke={C.muted} />
        <Bits x={80} y={80} bits="0000" label="= 0" tone={() => C.green} />
        <text x={120} y={130} textAnchor="middle" fontSize={9.5} fill={C.muted}>a number XOR itself is 0</text>
      </Art>
    ),
  },
  {
    title: "n & (n − 1) clears the lowest 1",
    caption: "Subtracting 1 flips the lowest 1 bit and every 0 below it. ANDing with the original keeps everything else. Repeat it to count or visit the 1 bits.",
    art: (
      <Art label="Twelve, eleven, and twelve AND eleven which is eight">
        <Bits x={90} y={22} bits="1100" label="n = 12" tone={(i) => (i === 1 ? C.amber : undefined)} />
        <Bits x={90} y={48} bits="1011" label="n − 1" />
        <line x1={90} x2={176} y1={74} y2={74} stroke={C.muted} />
        <Bits x={90} y={80} bits="1000" label="& = 8" tone={(i) => (i === 0 ? C.green : undefined)} />
        <text x={120} y={130} textAnchor="middle" fontSize={9.5} fill={C.amber}>the lowest 1 (amber) is gone</text>
      </Art>
    ),
  },
  {
    title: "Add with XOR and carries",
    caption: "a ^ b is the column sum ignoring carries; (a & b) << 1 is the carries, shifted into the next column. Keep adding those two until there's no carry.",
    art: (
      <Art label="Three plus one: XOR gives two, carries give two, and repeating gives four">
        <Bits x={90} y={14} bits="0011" label="a = 3" />
        <Bits x={90} y={40} bits="0001" label="b = 1" />
        <Bits x={90} y={74} bits="0010" label="a ^ b" />
        <Bits x={90} y={100} bits="0010" label="carry" tone={(i) => (i === 2 ? C.amber : undefined)} />
        <text x={120} y={140} textAnchor="middle" fontSize={9.5} fill={C.muted}>repeat: 2 + 2 → 4</text>
      </Art>
    ),
  },
];

const Intro: React.FC = () => (
  <section aria-labelledby="bm-pattern-title" className="space-y-4">
    <SectionTitle id="bm-pattern-title" kicker="The pattern" title="Bit Manipulation: work on the binary digits directly">
      <p>
        Integers are rows of bits, and a few operations act on all of them at once: AND, OR, XOR, NOT and shifts. A handful of identities
        (x ^ x = 0, n & (n − 1), carries as (a & b) &lt;&lt; 1) turn into one-line solutions with O(1) memory.
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Tricks worth knowing</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li><span className="text-foreground">x ^ x = 0</span>: find the odd one out; compare two sets in O(1) memory.</li>
          <li><span className="text-foreground">n & (n − 1)</span>: clear the lowest set bit; n is a power of two if the result is 0.</li>
          <li><span className="text-foreground">(n &gt;&gt; i) & 1</span> reads bit i; <span className="text-foreground">res | (1 &lt;&lt; i)</span> sets it.</li>
          <li>Python's integers have no fixed width: mask with 0xffffffff when 32-bit behaviour matters.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Reading the pictures</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>Small numbers are shown as 8 bits, with each bit's position under it. Blue cells are 1s.</li>
          <li>32-bit values are a 4 × 8 grid: the first row is bits 31–24, the last row bits 7–0.</li>
          <li>Teal marks the bit being changed now; amber marks carries.</li>
        </ul>
      </Surface>
    </div>
  </section>
);

const BitsPage: React.FC = () => <PatternPage category="Bit Manipulation" intro={<Intro />} problems={BITS} />;

export default BitsPage;
