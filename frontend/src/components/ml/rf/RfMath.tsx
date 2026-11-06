// "The maths, step by step" for random forests: why about a third is left out,
// how voting helps, and why the trees must be different. Numbers come from
// lib/ml/randomForest (checked by randomForest.test.ts).

import * as React from "react";

import { leftOutChance, majorityRight } from "../../../lib/ml/randomForest";
import { C } from "../colors";
import { Eq, SectionTitle, Step } from "../mathBlocks";

const r = (v: number, d = 4) => String(+v.toFixed(d));

const RfMath: React.FC = () => {
  const three = [
    [0.9, 0.1],
    [0.6, 0.4],
    [0.2, 0.8],
  ];
  const avg = [0, 1].map((c) => three.reduce((s, t) => s + t[c], 0) / three.length);

  return (
    <section aria-labelledby="rf-math-title" className="space-y-4">
      <SectionTitle id="rf-math-title" kicker="No magic, just probability" title="The maths, step by step">
        <p>Four small steps explain why a forest works. Every number is calculated by the same code that grows the forest above.</p>
      </SectionTitle>

      <ol className="space-y-3 p-0">
        <Step
          n={1}
          title="Why about a third of the rows are left out"
          plain="A bootstrap sample makes n picks from n rows, putting each row back after it's picked. On any single pick, one particular row is missed with chance (1 − 1/n). To be left out completely it has to be missed on all n picks."
        >
          <p className="text-muted-foreground">chance a row is never picked = (1 − 1/n)ⁿ</p>
          <Eq lhs="n = 10" rule="(1 − 1/10)¹⁰ = 0.9¹⁰" result={leftOutChance(10)} />
          <Eq lhs="n = 80 (this page)" rule="(1 − 1/80)⁸⁰" result={leftOutChance(80)} />
          <Eq lhs="n = 1,000,000" rule="(1 − 1/1,000,000)^1,000,000" result={leftOutChance(1e6)} />
          <p className="pt-1 text-muted-foreground">
            As n grows, this gets closer and closer to 1/e = {r(Math.exp(-1))}: about 37%, or roughly a third. Those left-out rows are each
            tree's out-of-bag rows.
          </p>
        </Step>

        <Step
          n={2}
          tone="backward"
          title="Why many okay voters beat one"
          plain="Imagine 25 trees that are each right 70% of the time, and suppose (for now) that their mistakes are completely independent. The forest is wrong only if 13 or more of them are wrong at once, which is unlikely."
        >
          <p className="text-muted-foreground">P(majority right) = Σ over k = 13…25 of C(25, k) · 0.7ᵏ · 0.3²⁵⁻ᵏ</p>
          <Eq lhs="1 tree" rule="right 70% of the time" result={majorityRight(1, 0.7)} />
          <Eq lhs="5 trees" rule="at least 3 of 5 right" result={majorityRight(5, 0.7)} accent={C.green} />
          <Eq lhs="25 trees" rule="at least 13 of 25 right" result={majorityRight(25, 0.7)} accent={C.green} />
          <p className="pt-1 text-muted-foreground">
            From 70% to about {Math.round(majorityRight(25, 0.7) * 100)}%, just by voting. That's the “wisdom of the crowd”.
          </p>
        </Step>

        <Step
          n={3}
          tone="backward"
          title="The catch: the trees aren't independent"
          plain="Step 2 assumed the trees make different mistakes. Trees grown on the same data tend to make the same ones, and if they all agree on a wrong answer, voting can't fix it. Real forests gain much less than step 2 suggests."
        >
          <p>That's exactly why random forests add randomness on purpose:</p>
          <p className="text-muted-foreground">· each tree gets a different bootstrap sample of the rows</p>
          <p className="text-muted-foreground">· each question may only look at a random subset of the features</p>
          <p className="pt-1">Both make the trees disagree more, so their errors overlap less and the average improves.</p>
        </Step>

        <Step
          n={4}
          tone="update"
          title="How the votes are combined"
          plain="scikit-learn doesn't count one vote per tree. It averages each tree's probabilities (the class shares in the leaf the point lands in), then picks the class with the biggest average. Here are three trees' answers for one point:"
        >
          {three.map((t, i) => (
            <p key={i}>
              tree {i + 1}: teal {t[0]}, violet {t[1]}
            </p>
          ))}
          <Eq lhs="average teal" rule={`(${three.map((t) => t[0]).join(" + ")}) ÷ 3`} result={avg[0]} accent={C.teal} />
          <Eq lhs="average violet" rule={`(${three.map((t) => t[1]).join(" + ")}) ÷ 3`} result={avg[1]} accent={C.violet} />
          <p className="pt-1 text-muted-foreground">
            Teal wins, {r(avg[0], 3)} to {r(avg[1], 3)}. A plain vote would also say teal (2 trees to 1), but averaging keeps track of how sure
            each tree was.
          </p>
        </Step>
      </ol>
    </section>
  );
};

export default RfMath;
