// Interview Patterns · Trees (the seventh NeetCode 150 category).

import * as React from "react";
import { Link } from "react-router-dom";

import { TREES } from "../../lib/patterns/trees";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, Arrowhead, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const N: React.FC<{ x: number; y: number; t: string; tone?: string }> = ({ x, y, t, tone }) => (
  <g>
    <circle cx={x} cy={y} r={12} fill={tone ?? C.card} fillOpacity={tone ? 0.3 : 1} stroke={tone ?? C.grid} />
    <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fill={C.fg}>{t}</text>
  </g>
);
const E: React.FC<{ a: [number, number]; b: [number, number]; tone?: string }> = ({ a, b, tone }) => <line x1={a[0]} y1={a[1] + 12} x2={b[0]} y2={b[1] - 12} stroke={tone ?? C.grid} strokeWidth={1.4} />;

const figures: ConceptFigure[] = [
  {
    title: "A node plus two smaller trees",
    caption: "Every subtree is a tree too. So most solutions decide what to do at one node and let the same function handle the left and right subtrees, down to the empty tree.",
    art: (
      <Art label="A root with its left and right subtrees circled as smaller trees">
        <N x={120} y={30} t="8" tone={C.teal} />
        <E a={[120, 30]} b={[70, 80]} />
        <E a={[120, 30]} b={[170, 80]} />
        <N x={70} y={80} t="3" />
        <N x={170} y={80} t="10" />
        <E a={[70, 80]} b={[45, 124]} />
        <E a={[70, 80]} b={[95, 124]} />
        <E a={[170, 80]} b={[195, 124]} />
        <N x={45} y={124} t="1" />
        <N x={95} y={124} t="6" />
        <N x={195} y={124} t="14" />
        <ellipse cx={70} cy={104} rx={42} ry={40} fill="none" stroke={C.sky} strokeDasharray="4 3" />
        <ellipse cx={183} cy={104} rx={30} ry={40} fill="none" stroke={C.violet} strokeDasharray="4 3" />
        <text x={30} y={60} fontSize={10} fill={C.sky}>left</text>
        <text x={196} y={60} fontSize={10} fill={C.violet}>right</text>
      </Art>
    ),
  },
  {
    title: "Answers up, or information down",
    caption: "Bottom-up: each node combines its children's answers (depth, height, best path). Top-down: each node passes something to its children (the max so far, a valid range).",
    art: (
      <Art label="Left: arrows going up from leaves labelled with heights. Right: arrows going down labelled with a range">
        <Arrowhead id="tr-up" color={C.green} />
        <Arrowhead id="tr-down" color={C.amber} />
        <N x={60} y={36} t="" tone={C.green} />
        <N x={30} y={110} t="" />
        <N x={90} y={110} t="" />
        <path d="M34,96 L54,52" stroke={C.green} markerEnd="url(#tr-up)" />
        <path d="M86,96 L66,52" stroke={C.green} markerEnd="url(#tr-up)" />
        <text x={30} y={138} textAnchor="middle" fontSize={10} fill={C.green}>↑1</text>
        <text x={90} y={138} textAnchor="middle" fontSize={10} fill={C.green}>↑1</text>
        <text x={60} y={16} textAnchor="middle" fontSize={10} fill={C.green}>1 + max = 2</text>
        <N x={180} y={36} t="5" tone={C.amber} />
        <N x={150} y={110} t="" />
        <N x={210} y={110} t="" />
        <path d="M174,50 L154,94" stroke={C.amber} markerEnd="url(#tr-down)" />
        <path d="M186,50 L206,94" stroke={C.amber} markerEnd="url(#tr-down)" />
        <text x={150} y={138} textAnchor="middle" fontSize={10} fill={C.amber}>(−∞, 5)</text>
        <text x={212} y={138} textAnchor="middle" fontSize={10} fill={C.amber}>(5, ∞)</text>
        <text x={180} y={16} textAnchor="middle" fontSize={10} fill={C.amber}>pass ranges down</text>
      </Art>
    ),
  },
  {
    title: "Depth first or breadth first",
    caption: "DFS (recursion or a stack) finishes one branch before the next. BFS (a queue) goes level by level, which is what “per level”, “nearest” and “right side” questions want.",
    art: (
      <Art label="The same tree numbered twice: DFS order down the left branch first, BFS order level by level">
        {[
          [60, 22, "1"],
          [30, 66, "2"],
          [90, 66, "5"],
          [15, 110, "3"],
          [45, 110, "4"],
        ].map(([x, y, d], i) => (
          <N key={`d${i}`} x={x as number} y={y as number} t={d as string} tone={C.teal} />
        ))}
        <E a={[60, 22]} b={[30, 66]} />
        <E a={[60, 22]} b={[90, 66]} />
        <E a={[30, 66]} b={[15, 110]} />
        <E a={[30, 66]} b={[45, 110]} />
        {[
          [180, 22, "1"],
          [150, 66, "2"],
          [210, 66, "3"],
          [135, 110, "4"],
          [165, 110, "5"],
        ].map(([x, y, b], i) => (
          <N key={`b${i}`} x={x as number} y={y as number} t={b as string} tone={C.violet} />
        ))}
        <E a={[180, 22]} b={[150, 66]} />
        <E a={[180, 22]} b={[210, 66]} />
        <E a={[150, 66]} b={[135, 110]} />
        <E a={[150, 66]} b={[165, 110]} />
        <text x={60} y={140} textAnchor="middle" fontSize={10.5} fill={C.teal}>DFS order</text>
        <text x={180} y={140} textAnchor="middle" fontSize={10.5} fill={C.violet}>BFS order</text>
      </Art>
    ),
  },
];

const linkCls = "text-primary underline-offset-2 hover:underline";

const Intro: React.FC = () => (
  <section aria-labelledby="tr-pattern-title" className="space-y-4">
    <SectionTitle id="tr-pattern-title" kicker="The pattern" title="Trees: solve it for one node, recurse for the rest">
      <p>
        A binary tree is a node with up to two children, each the root of a smaller tree. Almost every tree problem is a depth-first search where
        you decide what happens at a single node, or a breadth-first search when the question is about levels. The real work is choosing what each
        call returns (bottom-up) or receives (top-down).
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">How to spot which kind</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li><span className="text-foreground">Combine the children's answers</span> (depth, height, diameter, path sum): post-order DFS returning a value.</li>
          <li><span className="text-foreground">Depends on the path from the root</span> (good nodes, valid ranges): pass it down as an argument.</li>
          <li><span className="text-foreground">Levels, “nearest”, “seen from the side”</span>: BFS with a queue, one level per round.</li>
          <li><span className="text-foreground">A BST</span>: compare with the node and go one way, like binary search; in-order visits it sorted.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Reading the pictures</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>Nodes are placed left to right in in-order, so a binary search tree reads as a sorted row.</li>
          <li>Blue text beside a node is what it returns or carries (↑ a height, a valid range); orange text under a node names a pointer.</li>
          <li>
            Inputs use LeetCode's level-order format, e.g. [3,9,20,null,null,15,7]. For the traversals themselves, see the{" "}
            <Link className={linkCls} to="/visualize/binaryTree">Binary Tree Traversal</Link> page.
          </li>
        </ul>
      </Surface>
    </div>
  </section>
);

const TreesPage: React.FC = () => <PatternPage category="Trees" intro={<Intro />} problems={TREES} />;

export default TreesPage;
