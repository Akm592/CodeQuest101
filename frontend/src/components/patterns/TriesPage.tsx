// Interview Patterns · Tries (the eighth NeetCode 150 category).

import * as React from "react";
import { Link } from "react-router-dom";

import { TRIES } from "../../lib/patterns/tries";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const R = 10;
const N: React.FC<{ x: number; y: number; t: string; tone?: string; ring?: boolean }> = ({ x, y, t, tone, ring }) => (
  <g>
    {ring && <circle cx={x} cy={y} r={R + 3} fill="none" stroke={tone ?? C.fg} strokeOpacity={0.7} />}
    <circle cx={x} cy={y} r={R} fill={tone ?? C.card} fillOpacity={tone ? 0.3 : 1} stroke={tone ?? C.grid} />
    <text x={x} y={y + 3.5} textAnchor="middle" fontSize={10} fill={C.fg}>{t}</text>
  </g>
);
const E: React.FC<{ a: [number, number]; b: [number, number]; tone?: string }> = ({ a, b, tone }) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  return <line x1={a[0] + (dx / l) * R} y1={a[1] + (dy / l) * R} x2={b[0] - (dx / l) * R} y2={b[1] - (dy / l) * R} stroke={tone ?? C.grid} strokeWidth={tone ? 2 : 1.3} />;
};

const figures: ConceptFigure[] = [
  {
    title: "Shared prefixes share a path",
    caption: "car, cat, cart and do. Each node is one letter, a path from the root spells a prefix, and a double ring marks where a word ends. cart reuses the whole car path.",
    art: (
      <Art label="A trie holding car, cat, cart and do, with rings on the last letter of each word">
        <N x={120} y={16} t="" />
        <E a={[120, 16]} b={[85, 46]} tone={C.teal} />
        <E a={[120, 16]} b={[170, 46]} />
        <N x={85} y={46} t="c" tone={C.teal} />
        <N x={170} y={46} t="d" />
        <E a={[85, 46]} b={[85, 76]} tone={C.teal} />
        <E a={[170, 46]} b={[170, 76]} />
        <N x={85} y={76} t="a" tone={C.teal} />
        <N x={170} y={76} t="o" ring />
        <E a={[85, 76]} b={[60, 106]} tone={C.teal} />
        <E a={[85, 76]} b={[110, 106]} />
        <N x={60} y={106} t="r" tone={C.teal} ring />
        <N x={110} y={106} t="t" ring />
        <E a={[60, 106]} b={[60, 136]} tone={C.teal} />
        <N x={60} y={136} t="t" tone={C.teal} ring />
        <text x={80} y={140} fontSize={9.5} fill={C.teal}>c → a → r → t</text>
        <text x={136} y={20} fontSize={9.5} fill={C.muted}>root</text>
      </Art>
    ),
  },
  {
    title: "A wildcard tries every child",
    caption: "Searching .ad: the dot could be any letter, so try each child of the root in turn and keep going from there. The first branch that reaches a word end answers true.",
    art: (
      <Art label="The root with children b, d and m; all three are tried for the dot and the b branch matches .ad">
        <N x={120} y={16} t="" tone={C.amber} />
        {[60, 120, 180].map((x, i) => (
          <g key={x}>
            <E a={[120, 16]} b={[x, 50]} tone={i === 0 ? C.green : C.amber} />
            <N x={x} y={50} t={"bdm"[i]} tone={i === 0 ? C.green : undefined} />
            <E a={[x, 50]} b={[x, 84]} tone={i === 0 ? C.green : undefined} />
            <N x={x} y={84} t="a" tone={i === 0 ? C.green : undefined} />
            <E a={[x, 84]} b={[x, 118]} tone={i === 0 ? C.green : undefined} />
            <N x={x} y={118} t="d" tone={i === 0 ? C.green : undefined} ring />
          </g>
        ))}
        <text x={150} y={30} fontSize={9.5} fill={C.amber}>“.” = any child</text>
        <text x={44} y={146} fontSize={9.5} fill={C.green}>bad matches</text>
      </Art>
    ),
  },
  {
    title: "Many words, one search",
    caption: "For Word Search II, walk the board and the trie together. A step is only taken if the next letter is a child in the trie, so cat, car and cart are all checked by the same walk.",
    art: (
      <Art label="A 3 by 3 letter board with the path c, a, t highlighted, next to a trie c, a with children t and r">
        {["cat", "art", "tsp"].map((line, r) =>
          [...line].map((ch, c) => {
            const on = r === 0;
            return (
              <g key={`${r}${c}`}>
                <rect x={14 + c * 34} y={22 + r * 34} width={30} height={30} rx={6} fill={on ? C.teal : C.card} fillOpacity={on ? 0.3 : 1} stroke={on ? C.teal : C.grid} />
                <text x={29 + c * 34} y={41 + r * 34} textAnchor="middle" fontSize={12} fill={C.fg}>{ch}</text>
              </g>
            );
          }),
        )}
        <text x={14} y={14} fontSize={9.5} fill={C.muted}>board</text>
        <N x={190} y={22} t="c" tone={C.teal} />
        <E a={[190, 22]} b={[190, 58]} tone={C.teal} />
        <N x={190} y={58} t="a" tone={C.teal} />
        <E a={[190, 58]} b={[165, 94]} tone={C.teal} />
        <E a={[190, 58]} b={[215, 94]} />
        <N x={165} y={94} t="t" tone={C.teal} ring />
        <N x={215} y={94} t="r" ring />
        <E a={[215, 94]} b={[215, 130]} />
        <N x={215} y={130} t="t" ring />
        <text x={150} y={140} fontSize={9.5} fill={C.muted}>trie</text>
      </Art>
    ),
  },
];

const linkCls = "text-primary underline-offset-2 hover:underline";

const Intro: React.FC = () => (
  <section aria-labelledby="tri-pattern-title" className="space-y-4">
    <SectionTitle id="tri-pattern-title" kicker="The pattern" title="Tries: store words letter by letter, share the prefixes">
      <p>
        A trie (prefix tree) stores words as paths from an empty root, one letter per node. Words with the same prefix share the nodes for it, so
        checking a word or a prefix takes one step per letter, however many words are stored. And one walk down the trie checks every word that
        shares the path at once.
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">How to spot it</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li><span className="text-foreground">Prefix questions</span>: “does any word start with …”, autocomplete, the longest common prefix.</li>
          <li><span className="text-foreground">Wildcards</span> in a dictionary lookup: branch over the children at each wildcard.</li>
          <li><span className="text-foreground">Many words searched in one place</span> (a board, a stream of letters): one trie, one search, instead of one search per word.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Reading the pictures</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>The top circle is the empty root. Each node below it is one letter; children are in alphabetical order.</li>
          <li>A double ring means a word ends at that node. Without it, the path is only a prefix of longer words.</li>
          <li>
            To insert and search your own words, try the <Link className={linkCls} to="/visualize/trie">Trie</Link> visualizer.
          </li>
        </ul>
      </Surface>
    </div>
  </section>
);

const TriesPage: React.FC = () => <PatternPage category="Tries" intro={<Intro />} problems={TRIES} />;

export default TriesPage;
