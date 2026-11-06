// "The maths, step by step" for decision trees: impurity by hand, then every
// candidate question on a 10-point example, scored. Numbers come from
// lib/ml/decisionTree (checked by decisionTree.test.ts).

import * as React from "react";

import { candidateSplits, impurity } from "../../../lib/ml/decisionTree";
import { C } from "../colors";
import { Eq, SectionTitle, Step } from "../mathBlocks";

const LABELS = [0, 0, 0, 1, 0, 0, 1, 1, 1, 1];
const NAMES = ["T", "V"];
const r = (v: number, d = 4) => String(+v.toFixed(d));

const Dot: React.FC<{ label: number }> = ({ label }) => (
  <span
    className="inline-grid h-7 w-7 place-items-center rounded-full font-mono text-[11px] font-semibold text-background"
    style={{ background: label ? C.violet : C.teal }}
  >
    {NAMES[label]}
  </span>
);

const TreeMath: React.FC = () => {
  const pts = React.useMemo(() => LABELS.map((label, i) => ({ x: i + 1, y: 0, label })), []);
  const parentGini = impurity([5, 5], "gini");
  const parentEntropy = impurity([5, 5], "entropy");
  const splits = React.useMemo(() => candidateSplits(pts, "x", 2, "gini"), [pts]);
  const best = splits.reduce((b, s) => (s.score < b.score ? s : b), splits[0]);
  const ent = React.useMemo(() => candidateSplits(pts, "x", 2, "entropy").find((s) => s.threshold === best.threshold)!, [pts, best.threshold]);
  const [l, rt] = [best.left, best.right];

  return (
    <section aria-labelledby="dt-math-title" className="space-y-4">
      <SectionTitle id="dt-math-title" kicker="No magic, just counting" title="The maths, step by step">
        <p>
          Take ten points on a line, at x = 1 to 10, five teal (T) and five violet (V). The tree wants one question “Is x ≤ t?” that splits
          them into the purest two groups. Every number below is calculated by the same code that builds the tree above.
        </p>
      </SectionTitle>

      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-white/[0.06] bg-black/20 p-4">
        {LABELS.map((lab, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Dot label={lab} />
            <span className="font-mono text-[10px] text-muted-foreground">{i + 1}</span>
          </div>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">x →</span>
      </div>

      <ol className="space-y-3 p-0">
        <Step
          n={1}
          title="How mixed is a group? Gini impurity"
          plain="Gini impurity adds up p × (1 − p) for every class, where p is that class's share of the group. It's also the chance that two points picked at random (with replacement) are different colours. 0 means pure; 0.5 is the most mixed two classes can be."
        >
          <p className="text-muted-foreground">Gini = Σ p · (1 − p)</p>
          <Eq lhs="All 10 points (p = 0.5 each)" rule="0.5 × 0.5 + 0.5 × 0.5" result={parentGini} />
          <Eq lhs="A pure group" rule="1 × 0 + 0 × 1" result={impurity([4, 0], "gini")} />
        </Step>

        <Step
          n={2}
          title="The other measure: entropy"
          plain="Entropy comes from information theory: how many yes/no questions, on average, you'd need to guess a point's colour. It's 0 for a pure group and 1 bit for a 50/50 split. It usually picks the same questions as Gini."
        >
          <p className="text-muted-foreground">entropy = −Σ p · log₂(p)</p>
          <Eq lhs="All 10 points" rule="−(0.5·log₂0.5 + 0.5·log₂0.5)" result={parentEntropy} />
        </Step>

        <Step
          n={3}
          tone="backward"
          title="Score every possible question"
          plain="Cut halfway between each pair of neighbours. For each cut, work out each side's Gini, then average them weighted by how many points each side has. Lower is better."
        >
          <table className="w-full min-w-[34rem] text-left text-[13px]">
            <thead>
              <tr className="text-[11px] text-muted-foreground">
                <th className="pb-1 pr-3 font-medium">Question</th>
                <th className="pb-1 pr-3 font-medium">Yes side (T / V)</th>
                <th className="pb-1 pr-3 font-medium">No side (T / V)</th>
                <th className="pb-1 pr-3 text-right font-medium">Weighted Gini</th>
                <th className="pb-1 text-right font-medium">Gain</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {splits.map((s) => {
                const isBest = s.threshold === best.threshold;
                return (
                  <tr key={s.threshold} className={isBest ? "text-viz-found" : ""}>
                    <td className="pr-3">x ≤ {s.threshold}?</td>
                    <td className="pr-3">{s.left.join(" / ")}</td>
                    <td className="pr-3">{s.right.join(" / ")}</td>
                    <td className="pr-3 text-right">{r(s.score)}</td>
                    <td className="text-right">{r(s.gain)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="pt-1 text-muted-foreground">Gain = the parent's Gini (0.5) minus the weighted Gini. The best question has the biggest gain.</p>
        </Step>

        <Step n={4} tone="backward" title={`Check the winner by hand: x ≤ ${best.threshold}`} plain="Here is the best row worked out in full.">
          <Eq lhs={`Yes side (${l[0]} T, ${l[1]} V)`} rule={`(${l[0]}/6)·(${l[1]}/6) + (${l[1]}/6)·(${l[0]}/6)`} result={impurity(l, "gini")} />
          <Eq lhs={`No side (${rt[0]} T, ${rt[1]} V)`} rule="pure" result={impurity(rt, "gini")} />
          <Eq lhs="Weighted" rule={`(6/10)·${r(impurity(l, "gini"))} + (4/10)·${r(impurity(rt, "gini"))}`} result={best.score} accent={C.amber} />
          <Eq lhs="Gain" rule={`0.5 − ${r(best.score)}`} result={best.gain} accent={C.green} />
          <p className="pt-1 text-muted-foreground">With entropy instead, the same question wins too: its gain is {r(ent.gain)} bits.</p>
        </Step>

        <Step
          n={5}
          tone="update"
          title="Repeat inside each side"
          plain={`The no side (x > ${best.threshold}) is already pure, so it becomes a leaf that predicts violet. The yes side still holds one violet point, so the tree asks another question there, the same way. That's the whole algorithm: score every question, keep the best, repeat.`}
        >
          <p>
            For two features, the tree simply scores every question on x and every question on y, and keeps the best of all of them. That's what
            the amber line shows above.
          </p>
        </Step>
      </ol>
    </section>
  );
};

export default TreeMath;
